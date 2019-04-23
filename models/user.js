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
    isSpectator: { type: Boolean, default: false },
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
            return { error: error._message }
        }
    }

    /**
     * 
     * @param {boolean} includeFullBns 
     * @param {boolean} includeProbation 
     * @param {boolean} includeNat 
     */
    async getAllByMode(includeFullBns, includeProbation, includeNat) {
        if (!includeFullBns && !includeProbation && !includeNat) return null;

        try {
            let fullUsers;
            if (includeFullBns && includeNat) {
                fullUsers = await User.aggregate([
                    {
                        $unwind: '$modes',
                    },
                    { 
                        $match: { 
                            $or: [{ group: 'bn' }, { group: 'nat' }],
                            isSpectator: { $ne: true } 
                        } 
                    },
                    { 
                        $group: {
                            _id: '$modes', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId' } }
                        } 
                    }
                ]);
            } else if (includeFullBns && !includeNat) {
                fullUsers = await User.aggregate([
                    {
                        $unwind: '$modes',
                    },
                    { 
                        $match: { 
                            group: 'bn',
                            isSpectator: { $ne: true } 
                        } 
                    },
                    { 
                        $group: {
                            _id: '$modes', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId' } }
                        } 
                    }
                ]);
            } else if(!includeFullBns && includeNat) {
                fullUsers = await User.aggregate([
                    {
                        $unwind: '$modes',
                    },
                    { 
                        $match: { 
                            group: 'nat',
                            isSpectator: { $ne: true } 
                        } 
                    },
                    { 
                        $group: {
                            _id: '$modes', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId' } }
                        } 
                    }
                ]);
            }


            let probationUsers
            if (includeProbation) {
                probationUsers = await User.aggregate([
                    {
                        $unwind: '$probation',
                    },
                    { 
                        $match: { 
                            group: 'bn',
                            isSpectator: { $ne: true } 
                        } 
                    },
                    { 
                        $group: {
                            _id: '$probation', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId', isProbation: true } }
                        } 
                    }
                ]);
            }
            if ((includeFullBns || includeNat) && includeProbation) {
                probationUsers.forEach(u => {
                    let i = fullUsers.findIndex(fullUser => fullUser._id === u._id);
                    if (i != -1) fullUsers[i].users = fullUsers[i].users.concat(u.users);
                });
                return fullUsers;
            } else if (includeFullBns || includeNat) {
                return fullUsers;
            } else {
                return probationUsers;
            }
        } catch (error) {
            return { error: error._message };
        }
    }
}

const service = new UserService();

module.exports = { service, User };