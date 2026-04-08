const mongoose = require('mongoose');

const CHATROOM_PARTICIPANT_ROLES = ['moderator', 'vetoer', 'voucher', 'user'];

const chatroomParticipantSchema = new mongoose.Schema({
    user: {
        type: 'ObjectId',
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: CHATROOM_PARTICIPANT_ROLES,
        default: 'user',
    },
    anonName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    identityPublic: {
        type: Boolean,
        default: false,
    },
}, { _id: false });

const chatroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    type: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    targetId: {
        type: 'ObjectId',
        required: true,
    },
    participants: [chatroomParticipantSchema],
    isPublic: {
        type: Boolean,
        default: false,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

chatroomSchema.pre('validate', function (next) {
    const anonNames = (this.participants || []).map(participant => (participant.anonName || '').trim().toLowerCase()).filter(Boolean);
    const duplicateAnonNames = anonNames.find((anonName, i) => anonNames.indexOf(anonName) !== i);

    if (duplicateAnonNames) {
        this.invalidate('participants', 'Participant anonymous names must be unique within the chatroom.');
    }

    next();
});

chatroomSchema.virtual('messages', {
    ref: 'ChatroomMessage',
    localField: '_id',
    foreignField: 'chatroom',
});

chatroomSchema.index({ type: 1, targetId: 1, createdAt: -1 });

const Chatroom = mongoose.model('Chatroom', chatroomSchema);

module.exports = Chatroom;
