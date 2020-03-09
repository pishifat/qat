const mongoose = require('mongoose');
const helper = require('../helpers/helpers');

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
    discordId: { type: Number },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class UserService {

    get isBnOrNat() {
        return this.group == 'bn' || this.group == 'nat' || this.isSpectator;
    }

    get isNat() {
        return this.group == 'nat' || this.isSpectator;
    }

    get isBn() {
        return this.group == 'bn';
    }

    /**
     * Find an user by a given username
     * @param {string} username
     */
    static findByUsername(username) {
        return this.findOne({ username: new RegExp('^' + helper.escapeUsername(username) + '$', 'i') });
    }

    /**
     * @param {boolean} includeFullBns
     * @param {boolean} includeProbation
     * @param {boolean} includeNat
     */
    static async getAllByMode(includeFullBns, includeProbation, includeNat) {
        if (!includeFullBns && !includeProbation && !includeNat) return null;

        try {
            let allUsers;
            let allBns;
            let allNats;

            if (includeFullBns && includeProbation && includeNat) {
                allUsers = await this.aggregate([
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
            } else if (includeFullBns || includeProbation) {
                allBns = await this.aggregate([
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

            if (includeNat && (!includeFullBns || !includeProbation)) {
                allNats = await this.aggregate([
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

            if (includeFullBns && includeProbation && includeNat) {
                for (let i = 0; i < allUsers.length; i++) {
                    allUsers[i].users.sort(function(a, b) {
                        if (a.username.toLowerCase() < b.username.toLowerCase()) return -1;
                        if (a.username.toLowerCase() > b.username.toLowerCase()) return 1;

                        return 0;
                    });
                    allUsers[i].users.sort(function(a, b) {
                        if (a.group < b.group) return 1;
                        if (a.group > b.group) return -1;

                        return 0;
                    });
                }

                return allUsers;
            } else if (!includeFullBns && !includeProbation) {
                return allNats;
            } else if (!includeNat && includeProbation && includeFullBns) {
                return allBns;
            } else if (includeProbation && !includeFullBns) {
                for (let i = 0; i < allBns.length; i++) {
                    allBns[i].users = allBns[i].users.filter(u => u.probation && u.probation.length);
                }

                allUsers = allBns;

                if (includeNat) {
                    allUsers = allUsers.concat(allNats);
                }

                return allUsers;
            } else if (!includeProbation && includeFullBns) {
                for (let i = 0; i < allBns.length; i++) {
                    allBns[i].users = allBns[i].users.filter(u => !u.probation || (u.probation && !u.probation.length));
                }

                allUsers = allBns;

                if (includeNat) {
                    allUsers = allUsers.concat(allNats);
                }

                return allUsers;
            }
        } catch (error) {
            return { error: error._message };
        }
    }

    static async getAllMediators() {
        try {
            return await this.aggregate([
                { $match: { group: { $ne: 'user' }, vetoMediator: true, isSpectator: { $ne: true }, probation: { $size: 0 } } },
                { $sample: { size: 1000 } },
            ]);
        } catch (error) {
            return { error: error._message };
        }
    }

}

userSchema.loadClass(UserService);
const User = mongoose.model('User', userSchema);

module.exports = User;
