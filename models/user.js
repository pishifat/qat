const mongoose = require('mongoose');
const BaseService = require('./baseService');

const userSchema = new mongoose.Schema({
    osuId: { type: Number, required: true },
    username: { type: String, required: true },
    group: { type: String, enum: ["bn", "nat", 'user'], default: 'user' },
    modes: [{ type: String, enum: ["osu", "taiko", "catch", "mania"] }],
    probation: [{ type: String, enum: ["osu", "taiko", "catch", "mania"] }],
    vetoMediator: { type: Boolean, default: true },
    isBnEvaluator: { type: Boolean, default: true },
    bnDuration: [{ type: Date }],
    natDuration: [{ type: Date }],
    isLeader: { type: Boolean }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const User = mongoose.model('User', userSchema);

class UserService extends BaseService
{
    constructor() {
        super(User);
    }

    /**
     * 
     * @param {number} osuId Id from osu site
     * @param {string} username 
     * @param {string} group Options: bn, nat, user
     */
    async create(osuId, username, group) {
        try {
            return await User.create({osuId: osuId, username: username, group: group});
        } catch(error) {
            return { error: error }
        }
    }
}

const service = new UserService();

module.exports = { service, User };