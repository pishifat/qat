const mongoose = require('mongoose');
const logsService = require('./log').service;
const BaseService = require('./baseService');

const userSchema = new mongoose.Schema({
    osuId: { type: Number, required: true },
    username: { type: String, required: true },
    group: { type: String, enum: ['bn', 'nat', 'user'], default: 'user' },
    modes: [{ type: String, enum: ['osu', 'taiko', 'catch', 'mania'] }],
    probation: [{ type: String, enum: ['osu', 'taiko', 'catch', 'mania'] }],
    vetoMediator: { type: Boolean, default: true },
    isBnEvaluator: { type: Boolean, default: true },
    isSpectator: { type: Boolean, default: false },
    bnDuration: [{ type: Date }],
    natDuration: [{ type: Date }],
    isLeader: { type: Boolean },
    bnProfileBadge: { type: Number, default: 0 },
    natProfileBadge: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.virtual('isBnOrNat').get(function() {
    return this.group == 'bn' || this.group == 'nat' || this.isSpectator;
});

userSchema.virtual('isNat').get(function() {
    return this.group == 'nat' || this.isSpectator;
});

userSchema.virtual('isBn').get(function() {
    return this.group == 'bn' || this.isSpectator;
});

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
            return await User.create({ osuId, username, group });
        } catch(error) {
            return { error: error._message };
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
                            $or: [{ group: 'bn' }, 
                                { $and:  
                                    [{ group: 'nat', 
                                        isSpectator: { $ne: true }, 
                                    }],
                                }],
                        }, 
                    },
                    { 
                        $group: {
                            _id: '$modes', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId', probation: '$probation', group: '$group' } },
                        }, 
                    },
                ]);
            }else if(includeFullBns || includeProbation){
                allBns = await User.aggregate([
                    {
                        $unwind: '$modes',
                    },
                    { 
                        $match: { 
                            group: 'bn',
                        }, 
                    },
                    { 
                        $group: {
                            _id: '$modes', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId', probation: '$probation', group: '$group' } },
                        }, 
                    },
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
                            isSpectator: { $ne: true }, 
                        }, 
                    },
                    { 
                        $group: {
                            _id: '$modes', users: { $push: { id: '$_id', username: '$username', osuId: '$osuId', group: '$group' } },
                        }, 
                    },
                ]);
            }
            if(includeFullBns && includeProbation && includeNat){
                return allUsers;
            }else if(!includeFullBns && !includeProbation){
                return allNats;
            }else if(!includeNat && includeProbation && includeFullBns){
                return allBns;
            }else if(includeProbation && !includeFullBns){
                for (let i = 0; i < allBns.length; i++) {
                    allBns[i].users = allBns[i].users.filter(u => u.probation && u.probation.length);
                }
                allUsers = allBns;
                if(includeNat){
                    allUsers = allUsers.concat(allNats);
                }
                return allUsers;
            }else if(!includeProbation && includeFullBns){
                for (let i = 0; i < allBns.length; i++) {
                    allBns[i].users = allBns[i].users.filter(u => !u.probation || (u.probation && !u.probation.length));
                }
                allUsers = allBns;
                if(includeNat){
                    allUsers = allUsers.concat(allNats);
                }
                return allUsers;
            }
        } catch (error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: error._message };
        }
    }

    async getAllMediators() {
        try{
            return await User.aggregate([
                { $match: { group: { $ne: 'user' }, vetoMediator: true, isSpectator: { $ne: true }, probation: { $size: 0 } } },
                { $sample: { size: 1000 } },
            ]);
        }catch (error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: error._message };
        }
    }
}

const service = new UserService();

module.exports = { service, User };