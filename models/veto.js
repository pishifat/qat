const mongoose = require('mongoose');

const vetoesSchema = new mongoose.Schema({
    vetoer: { type: 'ObjectId', ref: 'User', required: true },
    mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania', 'all'] },
    reasons: [{
        _id: false,
        link: { type: String }, // previously required, but not anymore with current veto format
        summary: { type: String, required: true },
        status: { type: String },
    }],
    beatmapId: { type: Number },
    beatmapTitle: { type: String },
    beatmapMapper: { type: String }, // username
    beatmapMapperId: { type: Number }, // osuId
    status: { type: String, enum: ['pending', 'chatroom', 'available', 'wip', 'archive'], default: 'pending' },
    /*
            these names are stupid because veto changes have been iterative, and changing names could lead to bugs that i don't want to deal with right now
            pending = waiting for BNs to vouch for the veto
            chatroom = specific users can anonymously discuss the veto
            available = chat has concluded and mediation is necessary. NAT can review the veto in this case and begin mediation
            wip = mediation period
            archive = archive
        */
    mediations: [{ type: 'ObjectId', ref: 'Mediation' }],
    deadline: { type: Date },
    vouchingUsers: [{ type: 'ObjectId', ref: 'User' }],
    chatroomUsers: [{ type: 'ObjectId', ref: 'User' }],
    chatroomUsersPublic: [{ type: 'ObjectId', ref: 'User' }],
    chatroomInitiated: { type: Date },
    chatroomMessages: [{
        date: { type: Date, required: true },
        content: { type: String, required: true },
        user: { type: 'ObjectId', ref: 'User' },
        userIndex: { type: Number },
        isSystem: { type: Boolean },
    }],
    chatroomMediationRequestedUsers: [{ type: 'ObjectId', ref: 'User' }],
    chatroomVoteEnabled: { type: Boolean },
    chatroomUpholdVoters: [{ type: 'ObjectId', ref: 'User' }],
    chatroomDismissVoters: [{ type: 'ObjectId', ref: 'User' }],
    chatroomLocked: { type: Boolean },
    publicMediations: [{ type: 'ObjectId', ref: 'Mediation' }],
    vetoFormat: { type: Number },
    /*
            1 = og (no longer used)
            2 = multi-reason vetoes (no longer used)
            3 = no more "partially agree" (default veto) (no longer used)
            4 = previously "re-mediation" with all BNs and 2 week deadline, now selects all BNs with 1 week deadline
            5 = uphold % from 50 to 70, requires 60% of meditators to vote before concluding
            6 = uphold % from 70 to 60
            7 = "reasons" does not have "link" field, introduction of 'pending' and 'chatroom' statuses
        */
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

/**
 * @type {import('./interfaces/veto').default}
 */
const Veto = mongoose.model('Veto', vetoesSchema);

module.exports = Veto;
