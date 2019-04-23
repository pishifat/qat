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
            let allUsers;
            let allBns;
            let allNats;
            
            if(includeFullBns && includeProbation && includeNat){
                allUsers = await User.aggregate([
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
                            _id: '$modes', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId', probation: '$probation', group: '$group' } }
                        } 
                    }
                ]);
            }else if(includeFullBns || includeProbation){
                allBns = await User.aggregate([
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
                            _id: '$modes', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId', probation: '$probation', group: '$group' } }
                        } 
                    }
                ]);
            }
            if(includeNat && (!includeFullBns || !includeProbation)){
                allNats = await User.aggregate([
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
                            _id: '$modes', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId', group: '$group' } }
                        } 
                    }
                ]);
            }
            if(includeFullBns && includeProbation && includeNat){
                return allUsers;
            }else if(!includeFullBns && !includeProbation){
                return allNats;
            }else if(!includeNat && includeProbation && includeFullBns){
                return allBns;
            }else if(includeProbation && !includeFullBns){
                allUsers = allBns.filter(u => u.probation.length);
                if(includeNat){
                    allUsers.concat(allNats);
                }
                return allUsers;
            }else if(!includeProbation && includeFullBns){
                allUsers = allBns.filter(u => !u.probation.length);
                if(includeNat){
                    allUsers.concat(allNats);
                }
                return allUsers;
            }
        } catch (error) {
            return { error: error._message };
        }
    }
}

const service = new UserService();

module.exports = { service, User };