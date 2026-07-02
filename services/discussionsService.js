const Discussion = require('../models/discussion');
const Mediation = require('../models/mediation');
const Logger = require('../models/log');
const User = require('../models/user');
const discord = require('../helpers/discord');
const util = require('../helpers/util');
const { websocketManager } = require('../helpers/websocket');
const { escapeRegex } = require('../helpers/util');
const { isDiscussionImageUrl } = require('../helpers/discussionImage');
const imageFingerprintService = require('./imageFingerprintService');
const imageSimilarityService = require('./imageSimilarityService');

const MINIMAL_SELECT = '_id title mode isActive isAcceptable isNatOnly isContentReview createdAt discussionLink mediations neutralAllowed onlyWrittenInput';

const defaultPopulate = [
    {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId groups',
        },
    },
    { path: 'creator' },
];

const inactiveBnDefaultPopulate = [
    {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'groups',
        },
    },
];

const listMediationPopulate = [
    {
        path: 'mediations',
        select: 'vote',
    },
];

const listInactiveBnPopulate = [
    {
        path: 'mediations',
        select: 'vote',
        populate: {
            path: 'mediator',
            select: 'groups',
        },
    },
];

function getActiveBnDefaultPopulate(mongoId) {
    return {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId groups',
            match: {
                _id: mongoId,
            },
        },
    };
}

function getTypeFilter(isContentReview) {
    return isContentReview
        ? { isContentReview: true }
        : { isContentReview: { $ne: true } };
}

function buildListFilters(opts = {}) {
    const conditions = [];
    if (opts.mode && opts.mode.trim()) {
        const modeStr = opts.mode.trim();
        conditions.push({ $or: [{ mode: modeStr }, { mode: 'all' }] });
    }
    if (opts.search && opts.search.trim()) {
        const escaped = escapeRegex(opts.search.trim());
        conditions.push({ title: { $regex: escaped, $options: 'i' } });
    }
    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0];
    return { $and: conditions };
}

function ensureId(doc) {
    if (doc && doc._id && !doc.id) {
        doc.id = doc._id.toString();
    }
    return doc;
}

/**
 * Returns a plain-object discussion safe to send to a non–full-read user.
 */
function sanitizeDiscussionMediations(discussion, mongoId, hasFullReadAccess) {
    if (!discussion || hasFullReadAccess || !mongoId) {
        return discussion && (typeof discussion.toObject === 'function' ? discussion.toObject() : { ...discussion });
    }

    const obj = discussion && (typeof discussion.toObject === 'function' ? discussion.toObject() : { ...discussion });
    if (!obj || !Array.isArray(obj.mediations)) return obj;

    const mediatorMatchesUser = (m) => m && m.mediator && String(m.mediator.id || m.mediator._id || m.mediator) === String(mongoId);
    const anonymousPlaceholder = (groups) => (groups && groups.length ? { id: '__anonymous__', groups } : { id: '__anonymous__' });

    if (obj.isActive) {
        obj.mediations = obj.mediations.filter(mediatorMatchesUser);
    } else {
        obj.mediations = obj.mediations.map((m) => {
            const copy = { ...m };
            copy.mediator = anonymousPlaceholder(m.mediator && m.mediator.groups);
            return copy;
        });
    }

    return obj;
}

function finalizeDiscussionResponse(discussion, mongoId, hasFullReadAccess) {
    if (!discussion) return null;
    const obj = sanitizeDiscussionMediations(discussion, mongoId, hasFullReadAccess);
    return ensureId(obj);
}

function discussionDetailPath(d) {
    const id = d.id || (d._id && d._id.toString());
    return d.isContentReview ? `/contentreview/${id}` : `/discussionvote/${id}`;
}

async function fetchActiveDiscussionsMinimal(isContentReview, hasFullReadAccess, mongoId, listFilters = {}) {
    const filter = {
        isHidden: { $ne: true },
        isActive: true,
        ...getTypeFilter(isContentReview),
        ...buildListFilters(listFilters),
    };

    if (!hasFullReadAccess) {
        filter.isNatOnly = { $ne: true };
    }

    const populate = hasFullReadAccess
        ? listMediationPopulate
        : [getActiveBnDefaultPopulate(mongoId)];

    const discussions = await Discussion.find(filter)
        .select(MINIMAL_SELECT)
        .populate(populate)
        .sort({ createdAt: -1 })
        .lean();

    return discussions.map((d) => ensureId(
        finalizeDiscussionResponse(d, mongoId, hasFullReadAccess)
    ));
}

async function fetchArchivedDiscussionsMinimal(isContentReview, page, limit, mongoId, hasFullReadAccess, listFilters = {}) {
    const filter = {
        isHidden: { $ne: true },
        isActive: false,
        ...getTypeFilter(isContentReview),
        ...buildListFilters(listFilters),
    };

    if (!hasFullReadAccess) {
        filter.isNatOnly = { $ne: true };
    }

    const skip = (Math.max(1, page) - 1) * limit;
    const populate = hasFullReadAccess ? listMediationPopulate : listInactiveBnPopulate;

    const discussions = await Discussion.find(filter)
        .select(MINIMAL_SELECT)
        .populate(populate)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return discussions.map((d) => ensureId(
        finalizeDiscussionResponse(d, mongoId, hasFullReadAccess)
    ));
}

async function countArchivedDiscussions(isContentReview, hasFullReadAccess, listFilters = {}) {
    const filter = {
        isHidden: { $ne: true },
        isActive: false,
        ...getTypeFilter(isContentReview),
        ...buildListFilters(listFilters),
    };

    if (!hasFullReadAccess) {
        filter.isNatOnly = { $ne: true };
    }

    return Discussion.countDocuments(filter);
}

async function getDiscussionById(id, isContentReview, mongoId, hasFullReadAccess, isNat) {
    const typeFilter = getTypeFilter(isContentReview);
    const doc = await Discussion.findOne({ _id: id, isHidden: { $ne: true }, ...typeFilter })
        .select('isActive isNatOnly')
        .lean();

    if (!doc) return null;

    if (!hasFullReadAccess) {
        if (doc.isNatOnly) return null;
    }

    let discussion;

    if (hasFullReadAccess) {
        discussion = await Discussion
            .findOne({ _id: id, isHidden: { $ne: true }, ...typeFilter })
            .populate(defaultPopulate);
    } else if (doc.isActive) {
        discussion = await Discussion
            .findOne({ _id: id, isNatOnly: { $ne: true }, isActive: true, isHidden: { $ne: true }, ...typeFilter })
            .populate([getActiveBnDefaultPopulate(mongoId), { path: 'creator' }]);
    } else {
        discussion = await Discussion
            .findOne({ _id: id, isNatOnly: { $ne: true }, isActive: false, isHidden: { $ne: true }, ...typeFilter })
            .populate([...inactiveBnDefaultPopulate, { path: 'creator' }]);
    }

    if (!discussion) return null;

    return finalizeDiscussionResponse(discussion, mongoId, hasFullReadAccess);
}

async function resolveDiscussionRoute(id) {
    const doc = await Discussion.findById(id).select('isContentReview isHidden').lean();
    if (!doc || doc.isHidden) return null;
    return {
        path: doc.isContentReview ? `/contentreview/${id}` : `/discussionvote/${id}`,
    };
}

async function submitDiscussion(body, session, userRequest) {
    const {
        discussionLink, title, shortReason, mode, isNatOnly, neutralAllowed,
        onlyWrittenInput, isContentReview, customText, agreeOverwriteText,
        neutralOverwriteText, disagreeOverwriteText,
    } = body;

    if (!discussionLink.length && isContentReview) {
        return { error: 'No link provided' };
    }

    const blockedUrls = ['ppy.sh', 'puu.sh', 'cdn.discordapp.com'];

    if (isContentReview && discussionLink.length > 0 && blockedUrls.some(u => discussionLink.includes(u))) {
        const url = new URL(discussionLink).hostname;
        return { error: `Images hosted on ${url} are not allowed as they can expire quickly. please use a different image host.` };
    }

    if (discussionLink.length) {
        util.isValidUrlOrThrow(discussionLink);
    }

    let overwriteTitle = title;
    let overwriteShortReason = shortReason;

    if (isContentReview) {
        const contentReviewCount = await Discussion.countDocuments({ isContentReview: true });
        overwriteTitle = `Content review #${contentReviewCount + 251}`;
        overwriteShortReason = `Is this content appropriate for a beatmap? ${discussionLink}`;
        if (shortReason.length) {
            overwriteShortReason += `\n\n*${shortReason}*`;
        }
    }

    let finalAgreeText;
    let finalNeutralText;
    let finalDisagreeText;

    if (customText) {
        if (agreeOverwriteText.length) finalAgreeText = agreeOverwriteText;
        if (neutralAllowed && neutralOverwriteText.length) finalNeutralText = neutralOverwriteText;
        if (disagreeOverwriteText.length) finalDisagreeText = disagreeOverwriteText;
    }

    let imageSimilarity;
    let imageSimilarityMethod;

    if (isContentReview && discussionLink.length && isDiscussionImageUrl(discussionLink)) {
        try {
            const fingerprintResult = await imageFingerprintService.fingerprintFromUrl(discussionLink);
            imageSimilarity = fingerprintResult.fingerprint;
            imageSimilarityMethod = fingerprintResult.method;
        } catch (error) {
            console.warn(`CR image fingerprint failed for ${discussionLink}: ${error.message}`);
        }
    }

    let discussion = await Discussion.create({
        discussionLink: discussionLink.length > 0 ? discussionLink : null,
        title: overwriteTitle,
        shortReason: overwriteShortReason,
        mode,
        creator: session.mongoId,
        isNatOnly,
        neutralAllowed,
        reasonAllowed: true,
        onlyWrittenInput,
        isContentReview,
        agreeOverwriteText: finalAgreeText,
        neutralOverwriteText: finalNeutralText,
        disagreeOverwriteText: finalDisagreeText,
        ...(imageSimilarity ? { imageSimilarity, imageSimilarityMethod } : {}),
    });

    discussion = await Discussion.findById(discussion.id).populate(defaultPopulate);

    const hasFullReadAccess = !!userRequest.hasFullReadAccess;
    const out = finalizeDiscussionResponse(discussion, session.mongoId, hasFullReadAccess);

    Logger.generate(session.mongoId, 'Submitted a discussion for voting', 'discussionVote', discussion._id);

    if (isContentReview) {
        websocketManager.sendNotification('data:content_review', {
            title: discussion.title,
            shortReason: discussion.shortReason,
            discussionLink: discussion.discussionLink,
            timestamp: new Date(),
        });
    }

    const detailUrl = `http://bn.mappersguild.com${discussionDetailPath(discussion)}`;

    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(session),
            color: discord.webhookColors.yellow,
            description: `**New discussion up for vote:** [${overwriteTitle}](${detailUrl})`,
            fields: [{
                name: 'Topic',
                value: overwriteShortReason.length > 900 ? overwriteShortReason.slice(0, 900) + '... *(truncated)*' : overwriteShortReason,
            }],
        }],
        isContentReview ? 'contentCase' : 'all'
    );

    if (isContentReview) {
        await discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(session),
                color: discord.webhookColors.yellow,
                description: `**New discussion up for vote:** [${overwriteTitle}](${detailUrl})`,
                fields: [{
                    name: 'Topic',
                    value: overwriteShortReason.length > 900 ? overwriteShortReason.slice(0, 900) + '... *(truncated)*' : overwriteShortReason,
                }],
            }],
            'internalContentCase'
        );

        const users = await User.find({ isActiveContentReviewer: true });
        const discordIds = users.map(u => u.discordId).filter(d => d);

        for (let i = 0; i < discordIds.length; i += 20) {
            await util.sleep(1000);
            await discord.userHighlightWebhookPost('internalContentCase', discordIds.slice(i, i + 20));
        }
    }

    return { discussion: out, success: 'Submitted discussion' };
}

async function submitMediation(id, body, session, userRequest) {
    const discussion = await Discussion.findById(id).populate('mediations');

    if (!discussion) {
        return { error: 'Discussion not found' };
    }

    if (!body.vote && !discussion.onlyWrittenInput) {
        return { error: 'Select your vote!' };
    }

    if (discussion.isNatOnly && !userRequest.isNatOrTrialNat) {
        return { error: 'Only NAT members can vote on this' };
    }

    let mediation = discussion.mediations.find(m => String(m.mediator) === String(session.mongoId));
    let isNewMediation = false;

    if (!mediation) {
        isNewMediation = true;
        mediation = new Mediation();
        mediation.mediator = session.mongoId;
    }

    mediation.comment = body.comment;
    mediation.vote = discussion.onlyWrittenInput ? 2 : body.vote;
    mediation.vccChecked = body.vccChecked;
    await mediation.save();

    if (isNewMediation) {
        discussion.mediations.push(mediation);
        await discussion.save();
    }

    const populate = userRequest.isNat
        ? defaultPopulate
        : [getActiveBnDefaultPopulate(session.mongoId), { path: 'creator' }];

    const d = await Discussion.findById(id).populate(populate);
    const hasFullReadAccess = !!userRequest.hasFullReadAccess;
    const out = finalizeDiscussionResponse(d, session.mongoId, hasFullReadAccess);

    Logger.generate(session.mongoId, 'Submitted vote for a discussion', 'discussionVote', d._id);

    return { discussion: out, success: 'Submitted vote' };
}

async function concludeMediation(id, session) {
    const discussion = await Discussion
        .findByIdAndUpdate(id, { isActive: false }, { new: true })
        .populate(defaultPopulate);

    if (!discussion) {
        return { error: 'Discussion not found' };
    }

    Logger.generate(session.mongoId, 'Concluded vote for a discussion', 'discussionVote', discussion._id);

    if (!discussion.isContentReview) {
        discord.discussionWebhookPost(discussion, session);
    }

    return { discussion, success: 'Concluded vote' };
}

async function updateDiscussion(id, body, session) {
    const title = body.title;
    const shortReason = body.shortReason;
    const discussionLink = body.discussionLink || '';
    const agreeOverwriteText = body.agreeOverwriteText || '';
    const neutralOverwriteText = body.neutralOverwriteText || '';
    const disagreeOverwriteText = body.disagreeOverwriteText || '';
    const neutralAllowed = body.neutralAllowed || false;

    if (!title || !shortReason) {
        return { error: 'Missing data' };
    }

    const discussion = await Discussion
        .findOne({ _id: id, isActive: true })
        .populate(defaultPopulate)
        .orFail();

    discussion.title = title;
    discussion.shortReason = shortReason;
    discussion.discussionLink = discussionLink;
    discussion.agreeOverwriteText = agreeOverwriteText;
    discussion.neutralOverwriteText = neutralOverwriteText;
    discussion.disagreeOverwriteText = disagreeOverwriteText;
    discussion.neutralAllowed = neutralAllowed;

    await discussion.save();

    Logger.generate(
        session.mongoId,
        `Changed discussion title to "${title}" and proposal to "${shortReason}"`,
        'discussionVote',
        discussion._id
    );

    return { discussion, success: 'Updated' };
}

async function setIsAcceptable(id, isAcceptable, session) {
    const discussion = await Discussion
        .findOne({ _id: id, isActive: false })
        .populate(defaultPopulate)
        .orFail();

    discussion.isAcceptable = isAcceptable;
    await discussion.save();

    Logger.generate(
        session.mongoId,
        `Changed consensus to ${isAcceptable ? 'pass' : 'fail'}`,
        'discussionVote',
        discussion._id
    );

    return { discussion, success: 'Updated' };
}

async function searchContentReviewsByImage(fileBuffer, archivedPage, limit, mongoId, hasFullReadAccess, method = imageSimilarityService.DEFAULT_METHOD) {
    let fingerprint;

    try {
        const fingerprintResult = await imageFingerprintService.fingerprintFromBuffer(fileBuffer, method);
        fingerprint = fingerprintResult.fingerprint;
    } catch (error) {
        return { error: error.message || 'Failed to process image' };
    }

    const filter = {
        isHidden: { $ne: true },
        isContentReview: true,
        imageSimilarity: { $exists: true, $ne: null },
    };

    if (!hasFullReadAccess) {
        filter.isNatOnly = { $ne: true };
    }

    const candidates = await Discussion.find(filter)
        .select(`${MINIMAL_SELECT} imageSimilarity imageSimilarityMethod isActive`)
        .lean();

    const ranked = imageSimilarityService.rankBySimilarity(fingerprint, candidates, { method });

    if (!ranked.length) {
        return {
            active: [],
            archived: {
                discussions: [],
                page: archivedPage,
                limit,
                totalCount: 0,
                totalPages: 1,
            },
            similarityScores: {},
        };
    }

    const similarityScores = {};
    const idOrder = new Map();

    ranked.forEach((entry, index) => {
        const id = String(entry.doc._id);
        similarityScores[id] = entry.distance;
        idOrder.set(id, index);
    });

    const activeIds = ranked.filter((entry) => entry.doc.isActive).map((entry) => entry.doc._id);
    const archivedIds = ranked.filter((entry) => !entry.doc.isActive).map((entry) => entry.doc._id);

    const activePopulate = hasFullReadAccess
        ? listMediationPopulate
        : [getActiveBnDefaultPopulate(mongoId)];
    const archivedPopulate = hasFullReadAccess
        ? listMediationPopulate
        : listInactiveBnPopulate;

    let active = [];

    if (activeIds.length) {
        const activeDocs = await Discussion.find({
            _id: { $in: activeIds },
            ...filter,
        })
            .select(MINIMAL_SELECT)
            .populate(activePopulate)
            .lean();

        activeDocs.sort((a, b) => idOrder.get(String(a._id)) - idOrder.get(String(b._id)));
        active = activeDocs.map((d) => ensureId(
            finalizeDiscussionResponse(d, mongoId, hasFullReadAccess)
        ));
    }

    const totalCount = archivedIds.length;
    const skip = (Math.max(1, archivedPage) - 1) * limit;
    const archivedPageIds = archivedIds.slice(skip, skip + limit);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    let archivedPageItems = [];

    if (archivedPageIds.length) {
        const archivedDocs = await Discussion.find({
            _id: { $in: archivedPageIds },
            ...filter,
        })
            .select(MINIMAL_SELECT)
            .populate(archivedPopulate)
            .lean();

        archivedDocs.sort((a, b) => idOrder.get(String(a._id)) - idOrder.get(String(b._id)));
        archivedPageItems = archivedDocs.map((d) => ensureId(
            finalizeDiscussionResponse(d, mongoId, hasFullReadAccess)
        ));
    }

    return {
        active,
        archived: {
            discussions: archivedPageItems,
            page: archivedPage,
            limit,
            totalCount,
            totalPages,
        },
        similarityScores,
    };
}

module.exports = {
    defaultPopulate,
    getActiveBnDefaultPopulate,
    inactiveBnDefaultPopulate,
    sanitizeDiscussionMediations,
    finalizeDiscussionResponse,
    discussionDetailPath,
    buildListFilters,
    fetchActiveDiscussionsMinimal,
    fetchArchivedDiscussionsMinimal,
    countArchivedDiscussions,
    getDiscussionById,
    resolveDiscussionRoute,
    submitDiscussion,
    searchContentReviewsByImage,
    submitMediation,
    concludeMediation,
    updateDiscussion,
    setIsAcceptable,
};
