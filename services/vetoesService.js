const Veto = require('../models/veto');
const User = require('../models/user');
const Logger = require('../models/log');
const chatroomsService = require('./chatroomsService');
const util = require('../helpers/util');
const osuBot = require('../helpers/osuBot');
const discord = require('../helpers/discord');
const { escapeRegex } = require('../helpers/util');

// Minimal projection for list views
const MINIMAL_SELECT = '_id beatmapId beatmapTitle beatmapMapper beatmapMapperId mode status createdAt deadline vetoFormat reasons mediations';

// population for NAT (full veto fetch)
const defaultPopulate = [
    { path: 'vetoer', select: 'username osuId' },
    { path: 'mediations', populate: { path: 'mediator', select: 'username osuId' } },
    { path: 'vouchingUsers', select: 'username osuId' },
    { path: 'chatroomUsers', select: 'username osuId' },
    { path: 'chatroomUsersPublic', select: 'username osuId' },
    { path: 'chatroomMediationRequestedUsers', select: 'username osuId' },
    { path: 'chatroomUpholdVoters', select: 'username osuId' },
    { path: 'chatroomDismissVoters', select: 'username osuId' },
    { path: 'publicMediations', select: 'vote reasonIndex mediator', populate: { path: 'mediator', select: 'username osuId' } },
    { path: 'chatroomMessages.user', select: 'username osuId' },
];

function getLimitedDefaultPopulate(mongoId) {
    return [
        { path: 'vetoer', select: 'username osuId', match: { _id: mongoId } },
        { path: 'mediations', match: { mediator: mongoId }, populate: { path: 'mediator', select: 'username osuId' } },
        { path: 'vouchingUsers', select: 'username osuId', match: { _id: mongoId } },
        { path: 'chatroomUsers', select: 'username osuId', match: { _id: mongoId } },
        { path: 'chatroomUsersPublic', select: 'username osuId', match: { _id: mongoId } },
        { path: 'chatroomMediationRequestedUsers', select: 'id' },
        { path: 'chatroomUpholdVoters', select: 'username osuId', match: { _id: mongoId } },
        { path: 'chatroomDismissVoters', select: 'username osuId', match: { _id: mongoId } },
        { path: 'publicMediations', match: { mediator: mongoId }, populate: { path: 'mediator', select: 'username osuId' } },
        { path: 'chatroomMessages.user', select: 'username osuId' },
    ];
}

function getPopulateForArchivedPublic(mongoId) {
    return [
        { path: 'vetoer', select: 'username osuId', match: { _id: mongoId } },
        { path: 'mediations', select: '-mediator -_id' },
        { path: 'vouchingUsers', select: 'username osuId', match: { _id: mongoId } },
        { path: 'chatroomUsers', select: 'username osuId', match: { _id: mongoId } },
        { path: 'chatroomUsersPublic', select: 'username osuId' },
        { path: 'chatroomUpholdVoters', select: 'username osuId', match: { _id: mongoId } },
        { path: 'chatroomDismissVoters', select: 'username osuId', match: { _id: mongoId } },
        { path: 'publicMediations', select: 'vote reasonIndex -_id' },
        { path: 'chatroomMessages.user', select: 'username osuId' },
    ];
}

function getPopulate(isNat, mongoId, status) {
    if (!isNat && status === 'archive') return getPopulateForArchivedPublic(mongoId);
    if (!isNat) return getLimitedDefaultPopulate(mongoId);
    return defaultPopulate;
}

/**
 * Returns a plain-object veto safe to send to a non-NAT user.
 */
function sanitizeVeto(veto, mongoId, isNat) {
    const obj = veto && (typeof veto.toObject === 'function' ? veto.toObject() : { ...veto });
    if (!obj || isNat || !mongoId) return obj;

    const mediatorMatchesUser = (m) => m && m.mediator && String(m.mediator.id || m.mediator) === String(mongoId);
    const userRefMatches = (u) => u && String(u.id || (u._id && u._id.toString())) === String(mongoId);

    if (obj.status !== 'archive' && Array.isArray(obj.mediations)) {
        obj.mediations = obj.mediations.filter(mediatorMatchesUser);
    }
    if (obj.status !== 'archive' && Array.isArray(obj.publicMediations)) {
        obj.publicMediations = obj.publicMediations.filter(mediatorMatchesUser);
    }
    if (Array.isArray(obj.chatroomMediationRequestedUsers)) {
        obj.chatroomMediationRequestedUsers = obj.chatroomMediationRequestedUsers.map(u =>
            userRefMatches(u) ? u : { id: '__anonymous__' }
        );
    }

    obj.vouchHistory = [];

    return obj;
}

function ensureId(doc) {
    if (doc && doc._id && !doc.id) {
        doc.id = doc._id.toString();
    }
    return doc;
}

/**
 * Build MongoDB filter for list filtering (mode + beatmap search).
 * Mode filter matches vetoes where mode is the specified mode or "all" (all applies to every mode).
 * @param {{ mode?: string, search?: string }} opts
 * @returns {object} Filter to merge with status filter
 */
function buildListFilters(opts = {}) {
    const conditions = [];
    if (opts.mode && opts.mode.trim()) {
        const modeStr = opts.mode.trim();
        conditions.push({ $or: [{ mode: modeStr }, { mode: 'all' }] });
    }
    if (opts.search && opts.search.trim()) {
        const escaped = escapeRegex(opts.search.trim());
        conditions.push({
            $or: [
                { beatmapTitle: { $regex: escaped, $options: 'i' } },
                { beatmapMapper: { $regex: escaped, $options: 'i' } },
            ],
        });
    }
    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0];
    return { $and: conditions };
}

/**
 * Fetch non-archived vetoes with minimal projection (no populate).
 * @param {object} listFilters - Optional { mode, search } for server-side filtering
 */
async function fetchActiveVetoesMinimal(isNat, canSeePending, mongoId, listFilters = {}) {
    const filter = canSeePending
        ? { status: { $ne: 'archive' } }
        : { status: { $nin: ['archive', 'pending'] } };
    Object.assign(filter, buildListFilters(listFilters));

    const vetoes = await Veto.find(filter)
        .select(MINIMAL_SELECT)
        .sort({ createdAt: -1 })
        .lean();

    return vetoes.map(v => ensureId(v));
}

/**
 * Fetch archived vetoes with minimal projection, paginated.
 * mediations is returned as length only to keep payload small.
 * @param {object} listFilters - Optional { mode, search } for server-side filtering
 */
async function fetchArchivedVetoesMinimal(page, limit, mongoId, listFilters = {}) {
    const filter = { status: 'archive' };
    Object.assign(filter, buildListFilters(listFilters));

    const skip = (Math.max(1, page) - 1) * limit;
    const vetoes = await Veto.find(filter)
        .select(MINIMAL_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return vetoes.map((v) => {
        const doc = ensureId(v);
        doc.mediations = Array.isArray(doc.mediations) ? doc.mediations.length : 0;
        return doc;
    });
}

/**
 * Count archived vetoes for pagination (respects same list filters).
 * @param {object} listFilters - Optional { mode, search }
 */
async function countArchivedVetoes(listFilters = {}) {
    const filter = { status: 'archive' };
    Object.assign(filter, buildListFilters(listFilters));
    return Veto.countDocuments(filter);
}

/**
 * Fetch full veto by ID with permissions and sanitization.
 */
async function getVetoById(id, mongoId, isNat, canSeePending) {
    const statusDoc = await Veto.findById(id).select('status').lean();
    if (!statusDoc) return null;
    if (statusDoc.status === 'pending' && !canSeePending) return null;

    let veto = await Veto.findById(id).populate(getPopulate(isNat, mongoId, statusDoc.status));
    if (!veto) return null;

    if (veto.status !== 'archive' && !(veto.chatroomUsers && veto.chatroomUsers.length)) {
        veto.chatroomMessages = [];
    }

    if (!isNat) {
        veto = sanitizeVeto(veto, mongoId, isNat);
    }

    return veto;
}

function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function parseIncludeUsers(includeUsers) {
    return String(includeUsers || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
}

async function createVetoChatroom(vetoId, payload, actor) {
    if (!actor?.isNat) {
        throw createError(403, 'Only NAT can create veto chatrooms.');
    }

    let veto = await Veto.findById(vetoId)
        .populate(defaultPopulate)
        .orFail(() => createError(404, 'Veto not found.'));

    if ((veto.vouchingUsers || []).length < 2) {
        throw createError(400, 'At least two vouching users are required before starting a veto chatroom.');
    }
    if (veto.status !== 'pending') {
        throw createError(400, 'This veto cannot move to the chatroom phase right now.');
    }

    const mapper = await User.findByUsernameOrOsuId(veto.beatmapMapperId);
    if (!mapper) {
        throw createError(404, `${veto.beatmapMapper} is not in BNsite database. Ask them to log in.`);
    }

    const additionalParticipants = parseIncludeUsers(payload.includeUsers);
    const roomCount = await chatroomsService.listRoomsByTarget('veto', vetoId, actor);
    const baseName = veto.status === 'archive'
        ? `Post-mediation: ${veto.beatmapTitle}`
        : `Veto Discussion: ${veto.beatmapTitle}`;
    const defaultName = roomCount.length === 0
        ? baseName
        : `${baseName} (${roomCount.length + 1})`;

    const chatroom = await chatroomsService.createRoom({
        name: String(payload.name || '').trim() || defaultName,
        type: 'veto',
        targetId: vetoId,
        isPublic: !!payload.isPublic,
        participantEntries: [
            {
                userId: veto.vetoer?._id,
                role: 'vetoer',
            },
            ...(veto.vouchingUsers || []).map(user => ({
                userId: user._id,
                role: 'voucher',
            })),
            {
                userId: mapper._id,
                role: 'user',
            },
            ...additionalParticipants.map(identifier => ({
                identifier,
                role: 'user',
            })),
        ],
        publicParticipantIds: [
            mapper._id,
        ],
        publicParticipantIdentifiers: additionalParticipants,
        systemMessages: [
            {
                content: `Welcome to the discussion forum for the pending veto on [**${veto.beatmapTitle}**](https://osu.ppy.sh/beatmapsets/${veto.beatmapId})! See the veto reasons above for context.\n\nUsers involved in this discussion:\n\n- Veto creator (anonymous)\n- BNs who vouched in support of the veto (anonymous)\n- Mapset host\n- Anyone else who the NAT thought was relevant\n\nThe veto's creator and vouching users are **anonymous**. If you're one of these users, you can reveal your identity with a button below.\n\nYour goal is to resolve the veto's concerns through discussion and/or changes to the map. Follow [osu!'s code of conduct](https://osu.ppy.sh/wiki/en/Rules/Code_of_conduct_for_modding_and_mapping) while doing this, and do not expose this discussion to outsiders! If a conclusion cannot be reached, you can allow the map to be mediated by a larger group of Beatmap Nominators. This option will become available 24h from this message!\n\nIf you have any questions or want to report something sketchy, talk to someone in the NAT. They can read and speak in this chatroom too.`,
            },
            {
                content: 'To start the discussion, the mapper should explain their thoughts on the veto!',
            },
        ],
    }, actor);

    veto.status = 'chatroom';
    veto.chatroomInitiated = new Date();
    await veto.save();

    const channel = {
        name: `Veto Discussion (${veto.mode == 'all' ? 'All game modes' : veto.mode == 'osu' ? 'osu!' : `osu!${veto.mode}`})`,
        description: 'A pending veto you are involved with has opened discussion',
    };
    const words = `Discussion for the pending veto on [**${veto.beatmapTitle}**](https://osu.ppy.sh/beatmapsets/${veto.beatmapId}) has begun!\n\nTry to reach a conclusion here: http://bn.mappersguild.com/vetoes/${veto.id}\n\nIf a conclusion cannot be reached, the veto may be mediated by a larger group of Beatmap Nominators.`;

    for (const participant of chatroom.participants || []) {
        const message = await osuBot.sendAnnouncement([participant.osuId], channel, words);
        await util.sleep(500);

        if (message !== true) {
            break;
        }
    }

    Logger.generate(
        actor.id || actor._id,
        'Initiated chatroom for veto',
        'veto',
        veto._id
    );

    const description = `Discussion initiated on [veto for **${veto.beatmapTitle}**](https://osu.ppy.sh/beatmapsets/${veto.beatmapId})`;

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor({
            username: actor.username,
            osuId: actor.osuId,
        }),
        color: discord.webhookColors.pink,
        description,
    }],
    'publicVetoes');

    const updatedVeto = await getVetoById(vetoId, actor.id || actor._id, true, true);

    return {
        chatroom,
        veto: updatedVeto,
    };
}

module.exports = {
    getPopulate,
    getLimitedDefaultPopulate,
    getPopulateForArchivedPublic,
    sanitizeVeto,
    fetchActiveVetoesMinimal,
    fetchArchivedVetoesMinimal,
    countArchivedVetoes,
    getVetoById,
    createVetoChatroom,
};
