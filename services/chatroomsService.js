const mongoose = require('mongoose');
const Chatroom = require('../models/chatroom');
const ChatroomMessage = require('../models/chatroomMessage');
const User = require('../models/user');
const Veto = require('../models/veto');
const { generateAnonName } = require('../helpers/scrap');

const SUPPORTED_CHATROOM_TYPES = ['veto'];
const USER_SELECT = 'username osuId';

function createError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function toIdString(value) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (value.user) return toIdString(value.user);
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    return String(value);
}

function ensureId(doc) {
    if (doc && doc._id && !doc.id) {
        doc.id = String(doc._id);
    }

    return doc;
}

function normalizeType(type) {
    return String(type || '').trim().toLowerCase();
}

function normalizeParticipantRole(role) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    return normalizedRole || 'user';
}

function uniqueIds(values) {
    const seen = new Set();
    const unique = [];

    for (const value of values || []) {
        const id = toIdString(value);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        unique.push(id);
    }

    return unique;
}

function getParticipantEntry(room, user) {
    const userId = toIdString(user);
    return (room?.participants || []).find(participant => toIdString(participant) === userId) || null;
}

function getExistingAnonNames(participants = []) {
    return new Set(
        participants
            .map(participant => (participant?.anonName || '').trim().toLowerCase())
            .filter(Boolean)
    );
}

function ensureValidTargetId(targetId) {
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
        throw createError(400, 'Invalid target id.');
    }
}

function assertSupportedType(type) {
    const normalizedType = normalizeType(type);

    if (!SUPPORTED_CHATROOM_TYPES.includes(normalizedType)) {
        throw createError(400, 'Unsupported chatroom type.');
    }

    return normalizedType;
}

async function assertTargetExists(type, targetId) {
    if (type === 'veto') {
        const exists = await Veto.exists({ _id: targetId });
        if (!exists) throw createError(404, 'Target not found.');
    }
}

async function resolveUsers({ ids = [], identifiers = [] } = {}) {
    const users = [];
    const seen = new Set();

    for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw createError(400, `Invalid user id: ${id}`);
        }

        const user = await User.findById(id).select(USER_SELECT);
        if (!user) throw createError(404, `User not found: ${id}`);

        const userId = toIdString(user);
        if (!seen.has(userId)) {
            seen.add(userId);
            users.push(user);
        }
    }

    for (const identifier of identifiers) {
        const trimmed = String(identifier || '').trim();
        if (!trimmed) continue;

        const user = await User.findByUsernameOrOsuId(trimmed).select(USER_SELECT);
        if (!user) throw createError(404, `${trimmed} is not in BNsite database. Ask them to log in.`);

        const userId = toIdString(user);
        if (!seen.has(userId)) {
            seen.add(userId);
            users.push(user);
        }
    }

    return users;
}

function normalizeUser(user) {
    if (!user) return null;

    return ensureId({
        id: toIdString(user),
        username: user.username,
        osuId: user.osuId,
    });
}

function normalizeParticipant(participant) {
    const normalized = normalizeUser(participant?.user);
    if (!normalized) return null;

    return {
        ...normalized,
        role: participant.role,
        anonName: participant.anonName,
        identityPublic: !!participant.identityPublic,
    };
}

function formatAnonUserLabel(anonName) {
    return `anon user "${anonName}"`;
}

/**
 * Markdown line for veto discussion vote system messages (reusable chatroom).
 * @param {{ mongoId?: string, username?: string, osuId?: number }} sessionUser
 */
function vetoDiscussionVoteActorLabel(sessionUser, room) {
    if (!sessionUser || !room) return 'A user';
    const entry = getParticipantEntry(room, sessionUser.mongoId);
    if (!entry) return 'A user';
    if (entry.identityPublic) {
        const u = normalizeUser(entry.user);
        if (u?.username) return `[**${u.username}**](https://osu.ppy.sh/users/${u.osuId})`;
    }
    return `**${formatAnonUserLabel(entry.anonName || 'Anonymous participant')}**`;
}

function formatParticipantSystemName(participant, options = {}) {
    const { userMap = new Map() } = options;
    const userId = toIdString(participant);

    if (!participant.identityPublic) {
        return formatAnonUserLabel(participant?.anonName || 'Anonymous participant');
    }

    const populatedUser = normalizeUser(participant?.user);
    const mappedUser = userMap.get(userId);
    return populatedUser?.username || mappedUser?.username || participant?.anonName || 'User';
}

function isNat(user) {
    return !!(user && user.isNat);
}

function isParticipant(user, room) {
    if (!user || !room) return false;
    return !!getParticipantEntry(room, user);
}

function isPublicParticipant(user, room) {
    if (!user || !room) return false;
    const entry = getParticipantEntry(room, user);
    return !!(entry && entry.identityPublic);
}

function canModerateRoom(user) {
    return isNat(user);
}

function canViewRoom(user, room) {
    if (!room) return false;
    if (canModerateRoom(user)) return true;
    if (isParticipant(user, room)) return true;
    return !!room.isPublic;
}

function canPostMessage(user, room) {
    if (!user || !room) return false;
    if (canModerateRoom(user)) return true;
    if (room.isLocked) return false;
    return isParticipant(user, room);
}

function canRevealSelf(user, room) {
    if (!user || !room) return false;
    if (!isParticipant(user, room)) return false;
    return !isPublicParticipant(user, room);
}

async function getVetoContext(targetId) {
    return await Veto.findById(targetId).select('vetoer vouchingUsers');
}

async function getRoomTypeContext(room) {
    if (!room) return null;
    if (room.type === 'veto') return await getVetoContext(room.targetId);
    return null;
}

function getRoomRole(room, userId, context, participantEntry = null) {
    if (participantEntry?.role) {
        return participantEntry.role;
    }

    if (room.type === 'veto' && context) {
        if (toIdString(context.vetoer) === String(userId)) return 'vetoer';
        const voucherIds = uniqueIds(context.vouchingUsers);
        if (voucherIds.includes(String(userId))) return 'voucher';
    }

    return 'user';
}

function getAnonymousLabel(message, aliasState) {
    if (!message || !aliasState) return 'Anonymous participant';

    const userId = toIdString(message.user);
    if (userId && aliasState.byUserId[userId]) return aliasState.byUserId[userId];

    let label;
    if (message.role === 'vetoer') {
        label = 'Anonymous vetoer';
    } else if (message.role === 'voucher') {
        aliasState.voucherCount += 1;
        label = `Anonymous voucher ${aliasState.voucherCount}`;
    } else {
        aliasState.userCount += 1;
        label = `Anonymous participant ${aliasState.userCount}`;
    }

    if (userId) {
        aliasState.byUserId[userId] = label;
    }

    return label;
}

function sanitizeMessageForUser(message, viewer, room, aliasState) {
    const moderator = canModerateRoom(viewer, room);
    if (!moderator && message.deletedAt) return null;

    const obj = ensureId(typeof message.toObject === 'function' ? message.toObject() : { ...message });
    obj.user = normalizeUser(obj.user);
    obj.anonName = obj.anonName || getAnonymousLabel(obj, aliasState);
    obj.canDelete = moderator && obj.role !== 'system' && !obj.deletedAt;
    obj.canRestore = moderator && !!obj.deletedAt;

    if (obj.role === 'system') {
        obj.displayName = 'BN website';
        return obj;
    }

    if (!moderator && obj.isAnonymous) {
        obj.displayName = obj.anonName;
        obj.user = null;
        return obj;
    }

    obj.displayName = obj.user?.username || obj.anonName || (obj.role === 'moderator' ? 'Moderator' : 'User');
    return obj;
}

function sanitizeRoomSummaryForUser(room, viewer) {
    const obj = ensureId(typeof room.toObject === 'function' ? room.toObject() : { ...room });
    const moderator = canModerateRoom(viewer, obj);
    const participant = isParticipant(viewer, obj);
    const publicParticipant = isPublicParticipant(viewer, obj);

    return {
        id: obj.id,
        name: obj.name,
        type: obj.type,
        targetId: toIdString(obj.targetId),
        isPublic: !!obj.isPublic,
        isLocked: !!obj.isLocked,
        participantCount: (obj.participants || []).length,
        publicParticipants: (obj.participants || [])
            .filter(participant => participant.identityPublic)
            .map(participant => normalizeUser(participant.user))
            .filter(Boolean),
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
        viewerCanModerate: moderator,
        viewerCanPost: canPostMessage(viewer, obj),
        viewerCanRevealSelf: canRevealSelf(viewer, obj),
        viewerIsParticipant: participant,
        viewerIsPublicParticipant: publicParticipant,
    };
}

function sanitizeRoomForUser(room, messages, viewer, context = null) {
    const obj = ensureId(typeof room.toObject === 'function' ? room.toObject() : { ...room });
    const moderator = canModerateRoom(viewer, obj);
    const aliasState = {
        byUserId: {},
        voucherCount: 0,
        userCount: 0,
    };

    const sanitizedMessages = (messages || [])
        .map(message => sanitizeMessageForUser(message, viewer, obj, aliasState))
        .filter(Boolean);

    return {
        ...sanitizeRoomSummaryForUser(obj, viewer),
        participants: moderator
            ? (obj.participants || [])
                .map(normalizeParticipant)
                .filter(Boolean)
            : [],
        messages: sanitizedMessages,
    };
}

async function getRoomDocumentById(id) {
    return await Chatroom.findById(id)
        .populate({ path: 'participants.user', select: USER_SELECT });
}

async function getRoomMessages(roomId) {
    return await ChatroomMessage.find({ chatroom: roomId })
        .sort({ createdAt: 1 })
        .populate({ path: 'user', select: USER_SELECT });
}

async function getRoomById(id, viewer) {
    const room = await getRoomDocumentById(id);
    if (!room || !canViewRoom(viewer, room)) return null;

    const messages = await getRoomMessages(room._id);
    const context = await getRoomTypeContext(room);
    return sanitizeRoomForUser(room, messages, viewer, context);
}

/**
 * List chatrooms for one target, filtered by viewer access.
 */
async function listRoomsByTarget(type, targetId, viewer) {
    const normalizedType = assertSupportedType(type);
    ensureValidTargetId(targetId);

    const rooms = await Chatroom.find({
        type: normalizedType,
        targetId,
    })
        .sort({ createdAt: -1 })
        .populate({ path: 'participants.user', select: USER_SELECT });

    return rooms
        .filter(room => canViewRoom(viewer, room))
        .map(room => sanitizeRoomSummaryForUser(room, viewer));
}

async function resolveParticipantEntries(entries = [], existingParticipants = []) {
    const participantEntries = [];
    const seen = new Set();
    const existingAnonNames = getExistingAnonNames(existingParticipants);

    for (const existingParticipant of existingParticipants) {
        const userId = toIdString(existingParticipant);
        if (!userId || seen.has(userId)) continue;
        seen.add(userId);
        participantEntries.push({
            user: userId,
            role: normalizeParticipantRole(existingParticipant.role),
            anonName: existingParticipant.anonName || generateAnonName(existingAnonNames),
            identityPublic: !!existingParticipant.identityPublic,
        });
    }

    for (const entry of entries) {
        const identifier = entry.identifier || entry.userId;
        if (!identifier) continue;

        let user;
        if (entry.userId && mongoose.Types.ObjectId.isValid(entry.userId)) {
            user = await User.findById(entry.userId).select(USER_SELECT);
        } else {
            user = await User.findByUsernameOrOsuId(String(identifier).trim()).select(USER_SELECT);
        }

        if (!user) {
            throw createError(404, `${identifier} is not in BNsite database. Ask them to log in.`);
        }

        const userId = toIdString(user);
        if (seen.has(userId)) continue;

        seen.add(userId);
        participantEntries.push({
            user: userId,
            role: normalizeParticipantRole(entry.role),
            anonName: (entry.anonName || '').trim() || generateAnonName(existingAnonNames),
            identityPublic: !!entry.identityPublic,
        });
    }

    return participantEntries;
}

async function createRoom(payload, actor) {
    if (!canModerateRoom(actor)) {
        throw createError(403, 'Only NAT can create chatrooms.');
    }

    const type = assertSupportedType(payload.type);
    ensureValidTargetId(payload.targetId);
    await assertTargetExists(type, payload.targetId);

    const name = String(payload.name || '').trim();
    if (!name) throw createError(400, 'Chatroom name is required.');

    const participantEntriesInput = Array.isArray(payload.participantEntries)
        ? payload.participantEntries
        : [
            ...(payload.participantIds || []).map(userId => ({ userId, role: 'user' })),
            ...(payload.participantIdentifiers || []).map(identifier => ({ identifier, role: 'user' })),
        ];
    const participants = await resolveParticipantEntries(participantEntriesInput);
    if (!participants.length) throw createError(400, 'Chatroom must include at least one participant.');

    const publicParticipants = await resolveUsers({
        ids: payload.publicParticipantIds,
        identifiers: payload.publicParticipantIdentifiers,
    });

    const publicIdSet = new Set(uniqueIds(publicParticipants));
    const participantEntriesById = new Map(participants.map(participant => [toIdString(participant.user), participant]));

    for (const publicParticipant of publicParticipants) {
        const publicParticipantId = toIdString(publicParticipant);
        if (!participantEntriesById.has(publicParticipantId)) {
            participantEntriesById.set(publicParticipantId, {
                user: publicParticipantId,
                role: 'user',
                anonName: generateAnonName(getExistingAnonNames(Array.from(participantEntriesById.values()))),
                identityPublic: true,
            });
        } else {
            participantEntriesById.get(publicParticipantId).identityPublic = true;
        }
    }

    const participantEntries = Array.from(participantEntriesById.values());

    const room = new Chatroom({
        name,
        type,
        targetId: payload.targetId,
        participants: participantEntries,
        isPublic: !!payload.isPublic,
        isLocked: !!payload.isLocked,
    });

    await room.save();

    const systemMessages = Array.isArray(payload.systemMessages) ? payload.systemMessages : [];
    if (systemMessages.length) {
        await ChatroomMessage.insertMany(systemMessages.map(message => ({
            chatroom: room._id,
            user: null,
            content: message.content,
            role: 'system',
            isAnonymous: false,
        })));
    }

    return await getRoomById(room._id, actor);
}

/**
 * Update the chatroom locked state.
 */
async function setRoomLockState(roomId, isLocked, actor) {
    if (!canModerateRoom(actor)) {
        throw createError(403, 'Only NAT can lock or unlock chatrooms.');
    }

    const room = await Chatroom.findById(roomId).orFail(() => createError(404, 'Chatroom not found.'));
    room.isLocked = !!isLocked;
    await room.save();

    return await getRoomById(room._id, actor);
}

/**
 * Add participants to a chatroom and emit a system audit message.
 */
async function addParticipants(roomId, payload, actor) {
    if (!canModerateRoom(actor)) {
        throw createError(403, 'Only NAT can add chatroom participants.');
    }

    const room = await Chatroom.findById(roomId).orFail(() => createError(404, 'Chatroom not found.'));
    const existingParticipantIds = new Set((room.participants || []).map(participant => toIdString(participant)));
    const participants = await resolveParticipantEntries([
        ...(payload.participantIds || []).map(userId => ({ userId, role: 'user' })),
        ...(payload.participantIdentifiers || []).map(identifier => ({ identifier, role: 'user' })),
    ], room.participants || []);
    const publicParticipants = await resolveUsers({
        ids: payload.publicParticipantIds,
        identifiers: payload.publicParticipantIdentifiers,
    });

    const participantEntriesById = new Map(participants.map(participant => [toIdString(participant.user), participant]));

    for (const publicParticipant of publicParticipants) {
        const publicParticipantId = toIdString(publicParticipant);
        if (!participantEntriesById.has(publicParticipantId)) {
            participantEntriesById.set(publicParticipantId, {
                user: publicParticipantId,
                role: 'user',
                anonName: generateAnonName(getExistingAnonNames(Array.from(participantEntriesById.values()))),
                identityPublic: true,
            });
        } else {
            participantEntriesById.get(publicParticipantId).identityPublic = true;
        }
    }

    room.participants = Array.from(participantEntriesById.values());

    await room.save();

    const addedParticipants = (room.participants || []).filter(participant => !existingParticipantIds.has(toIdString(participant)));
    if (addedParticipants.length) {
        const publicParticipantUserMap = new Map(publicParticipants.map(user => [toIdString(user), normalizeUser(user)]));
        const addedNames = addedParticipants
            .map(participant => formatParticipantSystemName(participant, {
                userMap: publicParticipantUserMap,
            }))
            .filter(Boolean);

        await ChatroomMessage.create({
            chatroom: room._id,
            user: null,
            anonName: null,
            content: `${addedNames.join(', ')} ${addedNames.length === 1 ? 'was' : 'were'} added to the chatroom.`,
            role: 'system',
            isAnonymous: false,
        });
    }

    return await getRoomById(room._id, actor);
}

/**
 * Remove one participant from a chatroom.
 */
async function removeParticipant(roomId, userId, actor) {
    if (!canModerateRoom(actor)) {
        throw createError(403, 'Only NAT can remove chatroom participants.');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw createError(400, 'Invalid user id.');
    }

    const room = await Chatroom.findById(roomId).orFail(() => createError(404, 'Chatroom not found.'));
    const targetUserId = String(userId);
    const participantIds = (room.participants || []).filter(participant => toIdString(participant) !== targetUserId);

    room.participants = participantIds;
    await room.save();

    return await getRoomById(room._id, actor);
}

/**
 * Create one chatroom message for the acting user.
 */
async function createMessage(roomId, payload, actor) {
    const room = await getRoomDocumentById(roomId);
    if (!room) throw createError(404, 'Chatroom not found.');
    if (!canPostMessage(actor, room)) {
        throw createError(403, room.isLocked ? 'This chatroom is locked.' : 'You cannot post in this chatroom.');
    }

    const content = String(payload.content || '').trim();
    if (!content) throw createError(400, 'Message content is required.');

    const userId = toIdString(actor);
    const context = await getRoomTypeContext(room);
    const participantEntry = getParticipantEntry(room, actor);
    const role = canModerateRoom(actor, room) ? 'moderator' : getRoomRole(room, userId, context, participantEntry);
    const isAnonymous = !canModerateRoom(actor, room) && !isPublicParticipant(actor, room);

    const message = new ChatroomMessage({
        chatroom: room._id,
        user: userId,
        anonName: participantEntry?.anonName || null,
        content,
        role,
        isAnonymous,
    });

    await message.save();
    return await getRoomById(room._id, actor);
}

/**
 * Mark the acting participant as public and emit a system message.
 */
async function revealSelf(roomId, actor) {
    const room = await Chatroom.findById(roomId).orFail(() => createError(404, 'Chatroom not found.'));
    if (!canRevealSelf(actor, room)) {
        throw createError(403, 'You cannot reveal yourself in this chatroom.');
    }

    const participantEntry = getParticipantEntry(room, actor);
    const participantIndex = (room.participants || []).findIndex(participant => toIdString(participant) === toIdString(actor));

    if (participantIndex >= 0) {
        room.participants[participantIndex].identityPublic = true;
        room.markModified('participants');
    }

    await room.save();

    await ChatroomMessage.create({
        chatroom: room._id,
        user: null,
        anonName: null,
        content: `${formatAnonUserLabel(participantEntry?.anonName || 'Anonymous participant')} is ${actor.username}! This will be reflected in future messages.`,
        role: 'system',
        isAnonymous: false,
    });

    return await getRoomById(room._id, actor);
}

async function updateMessageDeletedAt(roomId, messageId, deletedAt, actor) {
    if (!canModerateRoom(actor)) {
        throw createError(403, 'Only NAT can moderate chatroom messages.');
    }

    const room = await Chatroom.findById(roomId).orFail(() => createError(404, 'Chatroom not found.'));
    const message = await ChatroomMessage.findOne({
        _id: messageId,
        chatroom: room._id,
    }).orFail(() => createError(404, 'Message not found.'));

    if (message.role === 'system') {
        throw createError(400, 'System messages cannot be moderated this way.');
    }

    message.deletedAt = deletedAt;
    await message.save();

    return await getRoomById(room._id, actor);
}

/**
 * Soft-delete one chatroom message.
 */
async function deleteMessage(roomId, messageId, actor) {
    return await updateMessageDeletedAt(roomId, messageId, new Date(), actor);
}

/**
 * Restore one previously soft-deleted chatroom message.
 */
async function restoreMessage(roomId, messageId, actor) {
    return await updateMessageDeletedAt(roomId, messageId, null, actor);
}

module.exports = {
    canViewRoom,
    canPostMessage,
    canModerateRoom,
    sanitizeRoomForUser,
    sanitizeMessageForUser,
    getRoomById,
    listRoomsByTarget,
    createRoom,
    setRoomLockState,
    addParticipants,
    removeParticipant,
    createMessage,
    revealSelf,
    deleteMessage,
    restoreMessage,
    vetoDiscussionVoteActorLabel,
};
