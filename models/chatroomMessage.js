const mongoose = require('mongoose');

const CHATROOM_ROLES = ['system', 'moderator', 'vetoer', 'voucher', 'user'];

const chatroomMessageSchema = new mongoose.Schema({
    chatroom: {
        type: 'ObjectId',
        ref: 'Chatroom',
        required: true,
    },
    user: {
        type: 'ObjectId',
        ref: 'User',
        default: null,
    },
    anonName: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    role: {
        type: String,
        enum: CHATROOM_ROLES,
        default: 'user',
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

chatroomMessageSchema.virtual('isModerator').get(function () {
    return this.role === 'moderator';
});

chatroomMessageSchema.index({ chatroom: 1, createdAt: 1 });

const ChatroomMessage = mongoose.model('ChatroomMessage', chatroomMessageSchema);

module.exports = ChatroomMessage;
