const Veto = require('../models/veto');
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

module.exports = {
    getPopulate,
    getLimitedDefaultPopulate,
    getPopulateForArchivedPublic,
    sanitizeVeto,
    fetchActiveVetoesMinimal,
    fetchArchivedVetoesMinimal,
    countArchivedVetoes,
    getVetoById,
};
