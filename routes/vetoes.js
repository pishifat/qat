const express = require('express');
const Veto = require('../models/veto');
const User = require('../models/user');
const Mediation = require('../models/mediation');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const osu = require('../helpers/osu');
const osuBot = require('../helpers/osuBot');
const discord = require('../helpers/discord');
const vetoesService = require('../services/vetoesService');
const chatroomsService = require('../services/chatroomsService');
const Chatroom = require('../models/chatroom');

const router = express.Router();

router.use(middlewares.isLoggedIn);

// population for NAT
const defaultPopulate = [
    {
        path: 'vetoer',
        select: 'username osuId',
    },
    {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId',
        },
    },
    {
        path: 'vouchingUsers',
        select: 'username osuId',
    },
    {
        path: 'chatroomUsers',
        select: 'username osuId',
    },
    {
        path: 'chatroomUsersPublic',
        select: 'username osuId',
    },
    {
        path: 'chatroomMediationRequestedUsers',
        select: 'username osuId',
    },
    {
        path: 'chatroomUpholdVoters',
        select: 'username osuId',
    },
    {
        path: 'chatroomDismissVoters',
        select: 'username osuId',
    },
    {
        path: 'publicMediations',
        select: 'vote reasonIndex mediator',
        populate: {
            path: 'mediator',
            select: 'username osuId',
        },
    },
    {
        path: 'chatroomMessages.user',
        select: 'username osuId',
    },
    {
        path: 'discussionChatroom',
        select: '_id',
    },
];

// population for logged out users. hides mediator info
function getLoggedOutPopulate() {
    return {
        path: 'mediations',
        select: '-mediator -comment -vote',
    };
}

// population for logged in users who aren't NAT. hides names of mediators and vetoers aside from the user
function getLimitedDefaultPopulate(mongoId) {
    return [
        {
            path: 'vetoer',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'mediations',
            match: {
                mediator: mongoId,
            },
            populate: {
                path: 'mediator',
                select: 'username osuId',
            },
        },
        {
            path: 'vouchingUsers',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'chatroomUsers',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'chatroomUsersPublic',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'chatroomMediationRequestedUsers',
            select: 'id',
        },
        {
            path: 'chatroomUpholdVoters',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'chatroomDismissVoters',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'publicMediations',
            match: {
                mediator: mongoId,
            },
            populate: {
                path: 'mediator',
                select: 'username osuId',
            },
        },
        {
            path: 'chatroomMessages.user',
            select: 'username osuId',
        },
        {
            path: 'discussionChatroom',
            select: '_id',
        },
    ];
}

function getPopulate(isNat, mongoId, status) {
    if (!mongoId) return getLoggedOutPopulate();
    if (!isNat && status === 'archive') return getPopulateForArchivedPublic(mongoId);
    if (!isNat) return getLimitedDefaultPopulate(mongoId);

    return defaultPopulate;
}

function getPopulateForArchivedPublic(mongoId) {
    return [
        {
            path: 'vetoer',
            select: 'username osuId',
            match: { _id: mongoId },
        },
        {
            path: 'mediations',
            select: '-mediator -_id',
        },
        {
            path: 'vouchingUsers',
            select: 'username osuId',
            match: { _id: mongoId },
        },
        {
            path: 'chatroomUsers',
            select: 'username osuId',
            match: { _id: mongoId },
        },
        {
            path: 'chatroomUsersPublic',
            select: 'username osuId',
        },
        {
            path: 'chatroomUpholdVoters',
            select: 'username osuId',
            match: { _id: mongoId },
        },
        {
            path: 'chatroomDismissVoters',
            select: 'username osuId',
            match: { _id: mongoId },
        },
        {
            path: 'publicMediations',
            select: 'vote reasonIndex -_id',
        },
        {
            path: 'chatroomMessages.user',
            select: 'username osuId',
        },
        {
            path: 'discussionChatroom',
            select: '_id',
        },
    ];
}

/** True if the current user is allowed to request mediation (vetoer, vouching user, or mapset host). */
function canRequestMediation(req, veto) {
    const mongoId = String(req.session.mongoId);
    const vetoerId = veto.vetoer && String(veto.vetoer.id || veto.vetoer._id);
    if (vetoerId === mongoId) return true;
    const voucherIds = (veto.vouchingUsers || []).map(u => u && String(u.id || u._id));
    if (voucherIds.includes(mongoId)) return true;
    if (veto.beatmapMapperId != null && Number(veto.beatmapMapperId) === Number(req.session.osuId)) return true;

    return false;
}

/**
 * Returns a plain-object veto safe to send to a non-NAT user:
 * - filters mediations and publicMediations to only the current user's entries unless user is NAT or veto is archived
 * - anonymizes chatroomMediationRequestedUsers (keeps array length and current user's ref, replaces others with placeholder)
 * - hides vouchHistory from non-NAT users
 */
function sanitizeVeto(veto, mongoId, isNat) {
    const obj = veto && (typeof veto.toObject === 'function' ? veto.toObject() : { ...veto });

    if (!obj || isNat || !mongoId) return obj;

    const mediatorMatchesUser = (m) => m && m.mediator && String(m.mediator.id || m.mediator) === String(mongoId);
    const userRefMatches = (u) => u && String(u.id || (u._id && u._id.toString())) === String(mongoId);

    // 1. Filter mediations
    if (obj.status !== 'archive' && Array.isArray(obj.mediations)) {
        obj.mediations = obj.mediations.filter(mediatorMatchesUser);
    }

    // 2. Filter publicMediations
    if (obj.status !== 'archive' && Array.isArray(obj.publicMediations)) {
        obj.publicMediations = obj.publicMediations.filter(mediatorMatchesUser);
    }

    // 3. Anonymize chatroomMediationRequestedUsers (keep length + current user, anonymize others)
    if (Array.isArray(obj.chatroomMediationRequestedUsers)) {
        obj.chatroomMediationRequestedUsers = obj.chatroomMediationRequestedUsers.map(u =>
            userRefMatches(u) ? u : { id: '__anonymous__' }
        );
    }

    // 4. vouchHistory is only used internally; hide it from non-NAT users
    obj.vouchHistory = [];

    return obj;
}

/* POST create a new veto. */
router.post('/submit', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const { mode, url, reasons } = req.body;

    // validation
    if (!reasons.length) {
        return res.json({ error: 'Veto must include reasons!' });
    }

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentVeto = await Veto.findOne(
        { vetoer: req.session.mongoId, createdAt: { $gte: fortyEightHoursAgo } },
        { _id: 1 }
    ).lean();

    if (recentVeto) {
        return res.json({ error: 'You can only submit one veto every 48 hours. Please try again later.' });
    }

    util.isValidUrlOrThrow(url);
    const beatmapsetId = util.getBeatmapsetIdFromUrl(url);
    const osuBeatmapset = await osu.getBeatmapsetInfo(req.session.accessToken, beatmapsetId);
    const eligibleStatuses = [-2, -1, 0, 3]; // see osu! api doc: https://osu.ppy.sh/docs/#beatmapset-rank-status

    if (!eligibleStatuses.includes(osuBeatmapset.ranked)) {
        return res.json({ error: `This map has a permanent leaderboard already!` });
    }

    if (!res.locals.userRequest.isBnOrNat) {
        return res.json({ error: 'Only BN and NAT members can submit vetoes!' });
    }

    // create veto
    let veto = await Veto.create({
        vetoer: req.session.mongoId,
        reasons,
        beatmapId: beatmapsetId,
        beatmapTitle: osuBeatmapset.artist + ' - ' + osuBeatmapset.title,
        beatmapMapper: osuBeatmapset.creator,
        beatmapMapperId: osuBeatmapset.user_id,
        mode,
        vetoFormat: 7,
    });
    veto = await Veto
        .findById(veto._id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    if (!res.locals.userRequest.isNat) {
        veto = sanitizeVeto(veto, req.session.mongoId, res.locals.userRequest.isNat);
    }

    res.json({
        veto,
        success: 'Submitted veto',
    });

    Logger.generate(
        req.session.mongoId,
        `Submitted a veto for mediation on "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );

    let description = `Anonymous user submitted [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes/${veto.id})`;

    for (let i = 0; i < veto.reasons.length; i++) {
        description += `\n- **Reason ${i + 1}:** ${veto.reasons[i].summary}`;
    }

    const vetoRole = veto.mode === 'all'
        ? ['osuVeto', 'taikoVeto', 'catchVeto', 'maniaVeto']
        : [`${veto.mode}Veto`];

    await discord.roleHighlightWebhookPost('publicVetoes', vetoRole, '', [{
        color: discord.webhookColors.darkPurple,
        description,
    }]);
});

/* POST submit mediation */
router.post('/submitMediation/:id', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const mediationData = req.body.mediation;
    const voteData = req.body.vote;
    const inputData = req.body.input;

    let isFirstComment = false;

    for (let i = 0; i < mediationData.mediationIds.length; i++) {
        const mediationId = mediationData.mediationIds[i];

        if (!inputData.comments[i]) {
            return res.json({ error: 'Mediation comments cannot be empty!' });
        }

        const mediation = await Mediation
            .findOne({
                _id: mediationId,
                mediator: req.session.mongoId,
            })
            .orFail();

        if (!mediation.comment && inputData.comments[i]) {
            isFirstComment = true;
        }

        mediation.comment = inputData.comments[i];
        mediation.vote = voteData.votes[i];
        await mediation.save();
    }

    let veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(true, req.session.mongoId)
        );

    if (!veto.discussionChatroom && !veto.chatroomUsers?.length) {
        veto.chatroomMessages = [];
    }

    // webhook
    let count = 0;

    for (const mediation of veto.mediations) {
        if (mediation.comment) count++;
    }

    if (isFirstComment) {
        let description = `Submitted opinion on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes/${veto.id})`;

        if (veto.reasons.length > 1) {
            for (let i = 0; i < veto.reasons.length; i++) {
                const submittedFilteredMediations = veto.mediations.filter(mediation => mediation.vote && mediation.reasonIndex == i);
                description += `\n\n**Reason ${i + 1}:**\n${veto.reasons[i].summary} (${submittedFilteredMediations.length}/${veto.mediations.length / veto.reasons.length})`;
            }
        } else {
            description += ` (${count}/${veto.mediations.length})`;
        }

        discord.webhookPost([{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightPurple,
            description,
        }],
        veto.mode);
    }

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    const vetoForResponse = sanitizeVeto(veto, req.session.mongoId, res.locals.userRequest.isNat);

    // return
    res.json({
        veto: vetoForResponse,
        success: 'Submitted mediation',
    });

    // log
    Logger.generate(
        req.session.mongoId,
        `Submitted vote for a veto`,
        'veto',
        veto._id
    );
});

/* POST reset mediation comment */
router.post('/resetMediation/:id', middlewares.isLoggedIn, middlewares.isAdmin, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    const mediation = veto.mediations.find(mediation => mediation._id == req.body.mediationId);

    mediation.comment = undefined;
    mediation.vote = undefined;

    await mediation.save();

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.black,
        description: `Reset mediation vote and comment by **${mediation.mediator.username}** for [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes/${veto.id})`,
    }],
    veto.mode
    );

    if (!res.locals.userRequest.isNat) {
        veto = sanitizeVeto(veto, req.session.mongoId, res.locals.userRequest.isNat);
    }

    res.json(veto);

    Logger.generate(
        req.session.mongoId,
        `Deleted mediation comment by ${mediation.mediator.username} for "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );
});

/* POST select mediators */
router.post('/selectMediators/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const { mode, excludeUsers } = req.body;

    const [allUsers, veto] = await Promise.all([
        User.getAllBnAndNat(),
        Veto
            .findById(req.params.id)
            .populate(defaultPopulate)
            .orFail(),
    ]);

    if (allUsers.error) {
        return res.json({
            error: allUsers.error,
        });
    }

    excludeUsers.push(veto.vetoer.username);

    for (const user of veto.vouchingUsers) {
        excludeUsers.push(user.username);
    }

    let users = [];

    const shuffled = [...allUsers].sort(() => Math.random() - 0.5);

    for (const user of shuffled) {
        if (!excludeUsers.includes(user.username.toLowerCase())) {
            if (mode == 'all') {
                users.push(user);
            } else if (user.modesInfo.some(m => m.mode === mode)) {
                users.push(user);
            }
        }
    }

    const count = Math.ceil(users.length * 0.4);

    res.json(users.slice(0, count));
});

/* POST begin mediation */
router.post('/beginMediation/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const vetoReasons = req.body.reasons;
    const mediatorIds = req.body.mediatorIds;
    let v;

    for (let i = 0; i < mediatorIds.length; i++) {
        let mediatorId = mediatorIds[i];

        for (let j = 0; j < vetoReasons.length; j++) {
            let m = await Mediation.create({ mediator: mediatorId, reasonIndex: j });
            v = await Veto.findByIdAndUpdate(req.params.id, {
                $push: { mediations: m },
                status: 'wip',
            });
        }
    }

    let date = new Date();
    let deadlineDays = 7;
    date.setDate(date.getDate() + deadlineDays);
    v = await Veto
        .findByIdAndUpdate(req.params.id, { deadline: date })
        .populate(defaultPopulate);

    res.json(v);
    Logger.generate(
        req.session.mongoId,
        `Started veto mediation for "${v.beatmapTitle}"`,
        'veto',
        v._id
    );
    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.purple,
        description: `Started mediation on [veto for **${v.beatmapTitle}**](https://bn.mappersguild.com/vetoes/${v.id})`,
    }],
    'publicVetoes');
});

/* POST conclude mediation */
router.post('/concludeMediation/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate);

    veto.status = 'archive';

    await veto.save();

    await vetoesService.publishVetoDiscussionChatroom(veto);

    res.json(veto);

    Logger.generate(
        req.session.mongoId,
        `Veto mediation concluded for "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.purple,
        description: `Concluded mediation on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes/${veto.id})`,
    }],
    'publicVetoes');
});

/* POST continue mediation */
router.post('/continueMediation/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findByIdAndUpdate(req.params.id, { status: 'wip' })
        .populate(defaultPopulate);

    res.json(veto);

    Logger.generate(
        req.session.mongoId,
        `Veto mediation for "${veto.beatmapTitle}" re-initiated`,
        'veto',
        veto._id
    );

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.purple,
        description: `**Resumed** mediation on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes/${veto.id})`,
    }],
    veto.mode);
});

/* POST delete veto */
router.post('/deleteVeto/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findByIdAndDelete(req.params.id)
        .orFail();

    res.json({ success: 'Deleted' });

    Logger.generate(
        req.session.mongoId,
        `Deleted veto for "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.black,
        description: `Deleted veto for **${veto.beatmapTitle}**`,
    }],
    veto.mode);
});

/* POST send messages */
router.post('/sendMessages/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .orFail();

    req.body.users.push({ osuId: req.session.osuId });

    const osuIds = req.body.users.map(user => user.osuId);

    const channel = {
        name: `Veto Mediation (${veto.mode == 'all' ? 'All game modes' : veto.mode == 'osu' ? 'osu!' : `osu!${veto.mode}`})`,
        description: 'Request to participate in a veto mediation',
    };

    const message = await osuBot.sendAnnouncement(osuIds, channel, req.body.message);

    if (message !== true) {
        return res.json({ error: message.error ? message.error : `Messages were not sent.` });
    }

    res.json({ success: 'Messages sent! A copy was sent to you for confirmation' });

    Logger.generate(
        req.session.mongoId,
        `Sent chat messages to mediators of "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.white,
        description: `Sent chat messages to mediators of [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes/${veto.id})`,
    }],
    veto.mode);
});

/* POST toggle vouch for a user on veto */
router.post('/toggleVouch/:id', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const userId = req.session.mongoId;

    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    if (veto.vetoer.id == userId) {
        return res.json({ error: 'You can\'t vouch for your own vetoes!' });
    }

    if (res.locals.userRequest.isNat) {
        return res.json({ error: 'NAT members cannot vouch!' });
    }

    if (veto.vouchingUsers.length >= 2) {
        return res.json({ error: 'This veto has already been vouched for by 2 BNs! It\'ll progress soon...' });
    }

    const vouchingUserIds = veto.vouchingUsers.map(u => u.id);
    const isVouching = !vouchingUserIds.includes(userId);

    if (isVouching) {
        const allVouchedVetoes = await Veto.find({ 'vouchHistory.user': userId });

        // Find the most recent vouch across all vetoes that isn't followed by an unvouch
        let lastActiveVouch = null;

        for (const v of allVouchedVetoes) {
            const userHistory = (v.vouchHistory || [])
                .filter(entry => String(entry.user) === String(userId))
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            if (!userHistory.length) continue;

            const latest = userHistory[userHistory.length - 1];

            if (latest.type === 'vouch') {
                if (!lastActiveVouch || new Date(latest.timestamp) > new Date(lastActiveVouch.timestamp)) {
                    lastActiveVouch = latest;
                }
            }
        }

        if (lastActiveVouch) {
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

            if (lastActiveVouch.timestamp >= fortyEightHoursAgo) {
                return res.json({ error: 'You can only vouch for one veto every 48 hours. Please try again later.' });
            }
        }
    }

    let toggleWebhook = false;

    if (!Array.isArray(veto.vouchHistory)) {
        veto.vouchHistory = [];
    }

    if (isVouching) {
        // add user to vouchingUsers
        veto.vouchingUsers.push(res.locals.userRequest._id);
        veto.vouchHistory.push({
            user: userId,
            type: 'vouch',
            timestamp: new Date(),
        });

        if (veto.vouchingUsers.length == 2) {
            toggleWebhook = true;
        }
    } else {
        // remove user from vouchingUsers
        let index = veto.vouchingUsers.findIndex(u => u.id == userId);
        veto.vouchingUsers.splice(index, 1);
        veto.vouchHistory.push({
            user: userId,
            type: 'unvouch',
            timestamp: new Date(),
        });
    }

    await veto.save();

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    if (!res.locals.userRequest.isNat) {
        veto = sanitizeVeto(veto, req.session.mongoId, res.locals.userRequest.isNat);
    }

    res.json({
        veto,
        success: `${isVouching? 'Vouched' : 'Removed vouch'} for veto`,
    });

    Logger.generate(
        req.session.mongoId,
        `${isVouching? 'Vouched' : 'Removed vouch'} for veto"`,
        'veto',
        veto._id
    );

    if (toggleWebhook) {
        const description = `**2 users** vouched for [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes/${veto.id})\n\nReview and initiate veto if necessary!`;

        discord.webhookPost([{
            color: discord.webhookColors.lightPurple,
            description,
        }],
        veto.mode);
    }
});

/* POST request mediation */
router.post('/requestMediation/:id', middlewares.isLoggedIn, async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    if (veto.status !== 'chatroom') {
        return res.status(400).json({ error: 'Mediation can only be requested during the chatroom phase.' });
    }

    if (!canRequestMediation(req, veto)) {
        return res.status(403).json({ error: 'Only the vetoer, vouching users, or mapset host can request mediation.' });
    }

    const requestedIds = (veto.chatroomMediationRequestedUsers || []).map(u => String(u && (u.id || u._id)));
    const alreadyRequested = requestedIds.includes(String(req.session.mongoId));

    if (!alreadyRequested) {
        veto.chatroomMediationRequestedUsers.push(req.session.mongoId);
    }

    await veto.populate([
        { path: 'chatroomMediationRequestedUsers', select: 'username osuId' },
    ]);

    const mapperInitiated = (veto.chatroomMediationRequestedUsers || []).some(u => u && Number(u.osuId) === Number(veto.beatmapMapperId));
    const requestCount = (veto.chatroomMediationRequestedUsers || []).length;
    const shouldStart = mapperInitiated || requestCount >= 2;

    const mapperLink = `[**${veto.beatmapMapper}**](https://osu.ppy.sh/users/${veto.beatmapMapperId})`;
    const userLink = `[**${req.session.username}**](https://osu.ppy.sh/users/${req.session.osuId})`;
    const isMapper = Number(veto.beatmapMapperId) === Number(req.session.osuId);

    if (!alreadyRequested) {
        const lines = shouldStart
            ? [`${mapperInitiated ? mapperLink : isMapper ? userLink : 'A user'} requested mediation. The discussion has concluded.`]
            : [`${isMapper ? userLink : 'A user'} requested mediation. Two requests are needed (mapset host counts as two).`];

        const wroteToRoom = await vetoesService.appendVetoDiscussionSystemMessages(veto, lines);
        if (!wroteToRoom) {
            for (const content of lines) {
                veto.chatroomMessages.push({
                    date: new Date(),
                    content,
                    user: null,
                    userIndex: 0,
                    role: 'system',
                });
            }
        }

        if (shouldStart) {
            veto.status = 'available';
            veto.chatroomLocked = true;
            await vetoesService.lockVetoDiscussionChatroom(veto);
        }

        await veto.save();
    }

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    const vetoForResponse = await vetoesService.finalizeVetoResponse(
        veto,
        req.session.mongoId,
        res.locals.userRequest.isNat
    );

    res.json({ veto: vetoForResponse });

    Logger.generate(
        req.session.mongoId,
        `Requested mediation in veto discussion`,
        'veto',
        veto._id
    );

    if (!alreadyRequested) {
        const description = `Mediation requested on [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes/${veto.id})`;

        discord.webhookPost([{
            color: discord.webhookColors.lightPink,
            description,
        }],
        veto.mode);
    }
});

/* POST start vote to dismiss veto */
router.post('/startVote/:id', middlewares.isLoggedIn, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    if (req.session.osuId != veto.beatmapMapperId) {
        return res.json({ error: 'Only the mapper can start a vote!' });
    }

    veto.chatroomVoteEnabled = true;
    veto.chatroomUpholdVoters = [];
    veto.chatroomDismissVoters = [];

    const startVoteLine = `[**${veto.beatmapMapper}**](https://osu.ppy.sh/users/${veto.beatmapMapperId}) started a vote to dismiss the veto!\n\nEnsure everyone knows which version of the map to vote on, then follow the instructions below.`;
    const wroteToRoom = await vetoesService.appendVetoDiscussionSystemMessages(veto, [startVoteLine]);
    if (!wroteToRoom) {
        veto.chatroomMessages.push({
            date: new Date(),
            content: startVoteLine,
            user: null,
            userIndex: 0,
            role: 'system',
        });
    }

    await veto.save();

    const vetoForResponse = await vetoesService.finalizeVetoResponse(
        veto,
        req.session.mongoId,
        res.locals.userRequest.isNat
    );

    res.json({ veto: vetoForResponse });

    Logger.generate(
        req.session.mongoId,
        `Started vote for veto in discussion`,
        'veto',
        veto._id
    );
});

/* POST submit vote on dismissal of veto */
router.post('/vote/:id', middlewares.isLoggedIn, async (req, res) => {
    const vote = req.body.vote;
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    if (!veto.chatroomVoteEnabled) {
        return res.json({ error: 'Vote not in progress!' });
    }

    const validVotingUserIds = veto.vouchingUsers.map(u => u.id);
    validVotingUserIds.push(veto.vetoer.id);

    if (!validVotingUserIds.includes(req.session.mongoId)) {
        return res.json({ error: 'Only the vetoer and the vouching users can vote!' });
    }

    const roomId = await vetoesService.resolveDiscussionChatroomId(veto);
    let userText;
    if (roomId) {
        const room = await Chatroom.findById(roomId).populate({ path: 'participants.user', select: 'username osuId' });
        if (room) {
            userText = chatroomsService.vetoDiscussionVoteActorLabel(req.session, room);
        }
    }
    if (!userText) {
        const chatroomUsersPublicIds = (veto.chatroomUsersPublic || []).map(u => u.id);
        const isPublicUser = chatroomUsersPublicIds.includes(req.session.mongoId);
        const privateUserIds = (veto.chatroomUsers || []).map(u => u.id);
        const userIndex = privateUserIds.findIndex(id => id == req.session.mongoId);
        userText = isPublicUser ? `[**${req.session.username}**](https://osu.ppy.sh/users/${req.session.osuId})` : `**Anonymous user ${userIndex + 1}**`;
    }

    const chatroomUpholdVotersIds = veto.chatroomUpholdVoters.map(u => u.id);
    const chatroomDismissVotersIds = veto.chatroomDismissVoters.map(u => u.id);
    let revote = false;

    if (vote == 'uphold') {
        if (chatroomUpholdVotersIds.includes(req.session.mongoId)) {
            return res.json({ error: 'Already voted!' });
        }

        if (chatroomDismissVotersIds.includes(req.session.mongoId)) {
            const index = veto.chatroomDismissVoters.findIndex(u => u.id == req.session.mongoId);
            veto.chatroomDismissVoters.splice(index, 1);
            revote = true;
        }

        veto.chatroomUpholdVoters.push(req.session.mongoId);
    } else if (vote == 'dismiss') {
        if (chatroomDismissVotersIds.includes(req.session.mongoId)) {
            return res.json({ error: 'Already voted!' });
        }

        if (chatroomUpholdVotersIds.includes(req.session.mongoId)) {
            const index = veto.chatroomUpholdVoters.findIndex(u => u.id == req.session.mongoId);
            veto.chatroomUpholdVoters.splice(index, 1);
            revote = true;
        }

        veto.chatroomDismissVoters.push(req.session.mongoId);
    } else {
        return res.json({ error: 'Invalid vote' });
    }

    const systemLines = [`${userText} ${revote ? 'changed their vote' : 'voted'} to ${vote}!`];
    let lockReusableDiscussionRoom = false;

    if (veto.chatroomUpholdVoters.length >= 2) {
        systemLines.push('A majority was reached! The veto was **not dismissed**, so the discussion will continue.\n\nIf the mapper makes further changes, a new vote can start.\n\nIf a conclusion cannot be reached, mediation may be requested.');
        veto.chatroomVoteEnabled = false;
    } else if (veto.chatroomDismissVoters.length >= 2) {
        systemLines.push('A majority was reached! The veto was **dismissed**, so the discussion has finished.\n\nThe NAT will review this discussion and archive the veto (if nothing broke). Thank you for participating!');
        veto.chatroomVoteEnabled = false;
        veto.chatroomLocked = true;
        lockReusableDiscussionRoom = true;

        discord.webhookPost([{
            color: discord.webhookColors.purple,
            description: `[Veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes/${veto.id}) dismissed by vote. Check to make sure if everything worked, and move to archive if so.`,
        }],
        veto.mode);
    }

    const wroteToRoom = await vetoesService.appendVetoDiscussionSystemMessages(veto, systemLines);
    if (!wroteToRoom) {
        for (const content of systemLines) {
            veto.chatroomMessages.push({
                date: new Date(),
                content,
                user: null,
                userIndex: 0,
                role: 'system',
            });
        }
    }

    if (lockReusableDiscussionRoom) {
        await vetoesService.lockVetoDiscussionChatroom(veto);
    }

    await veto.save();

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    const vetoForResponse = await vetoesService.finalizeVetoResponse(
        veto,
        req.session.mongoId,
        res.locals.userRequest.isNat
    );

    res.json({ veto: vetoForResponse });

    Logger.generate(
        req.session.mongoId,
        `Voted "${vote}" for veto in discussion`,
        'veto',
        veto._id
    );
});

/* POST set veto status as "available" */
router.post('/setStatusAvailable/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        ).orFail();

    veto.status = 'available';
    await veto.save();

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Set veto status to "available"`,
        'veto',
        veto._id
    );

    let description = `Concluded discussion on [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes/${veto.id})`;

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.darkPurple,
        description,
    }],
    'publicVetoes');
});

/* POST set veto status as "archive" */
router.post('/setStatusArchive/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        ).orFail();

    veto.status = 'archive';
    await veto.save();

    await vetoesService.publishVetoDiscussionChatroom(veto);

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Set veto status to "archive"`,
        'veto',
        veto._id
    );

    let description = `Archived [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes/${veto.id})`;

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.gray,
        description,
    }],
    'publicVetoes');
});

/* POST submit public mediation */
router.post('/submitPublicMediation/:id', middlewares.isLoggedIn, async (req, res) => {
    const voteData = req.body.vote;
    let veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(true, req.session.mongoId)
        ).orFail();

    for (let index = 0; index < veto.reasons.length; index++) {
        let mediation = veto.publicMediations.find(m => m.mediator.id == req.session.mongoId && m.reasonIndex == index);
        const vote = voteData.votes[index];

        if (!mediation && vote) {
            mediation = new Mediation();
            mediation.mediator = req.session.mongoId;
            mediation.vote = voteData.votes[index];
            mediation.reasonIndex = index;
            await mediation.save();
            veto.publicMediations.push(mediation);
            await veto.save();
        } else if (mediation && vote) {
            mediation.vote = vote;
            await mediation.save();
        }
    }

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        ).orFail();

    if (!veto.discussionChatroom && !veto.chatroomUsers?.length) {
        veto.chatroomMessages = [];
    }

    const vetoForResponse = sanitizeVeto(veto, req.session.mongoId, res.locals.userRequest.isNat);

    res.json({ veto: vetoForResponse, success: 'Submitted mediation!' });

    Logger.generate(
        req.session.mongoId,
        `Submitted community veto mediation`,
        'veto',
        veto._id
    );
});

/* POST set veto reason status */
router.post('/setVetoReasonStatus/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const { status, reasonIndex } = req.body;

    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        ).orFail();

    if (status !== 'upheld' && status !== 'dismissed') {
        return res.json({ error: 'Invalid status' });
    }

    veto.reasons[reasonIndex].status = status;
    await veto.save();

    res.json({ veto, success: 'Set veto reason status to ' + status });

    Logger.generate(
        req.session.mongoId,
        `Set veto reason status as "${status}"`,
        'veto',
        veto._id
    );
});

module.exports = router;
