const mongoose = require('mongoose');
const util = require('../helpers/util');
const moment = require('moment');
const Settings = require('./settings');

const userSchema = new mongoose.Schema({
    osuId: { type: Number, required: true },
    username: { type: String, required: true },
    groups: [{ type: String, enum: ['user', 'bn', 'nat', 'gmt'], default: ['user'] }],
    modesInfo: [{
        _id: false,
        mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
        level: { type: String, enum: ['full', 'probation'], required: true },
    }],
    history: [{
        _id: false,
        date: { type: Date, required: true },
        mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania'], required: true },
        kind: { type: String, enum: ['joined','left'], required: true },
        group: { type: String, enum: ['bn', 'nat'], default: 'bn' },
        relatedEvaluation: { type: 'ObjectId' },
    }],
    isVetoMediator: { type: Boolean, default: true },
    isBnEvaluator: { type: Boolean, default: true },
    inBag: { type: Boolean, default: true },
    isTrialNat: { type: Boolean, default: false }, // used to give BNs some NAT permissions during trial run
    bnProfileBadge: { type: Number, default: 0 },
    natProfileBadge: { type: Number, default: 0 },
    rankedBeatmapsets: { type: Number, default: 0 },
    discordId: { type: String },
    requestStatus: [{ type: String, enum: ['gameChat', 'personalQueue', 'globalQueue', 'closed'] }],
    requestLink: { type: String },

    /* temporary fields for qa leaderboard webhook */
    recentQaChecks: { type: Number },
    allQaChecks: { type: Number },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class UserService extends mongoose.Model {

    // Groups
    get isNat () {
        return this.groups && this.groups.includes('nat');
    }

    get isBn () {
        return this.groups && this.groups.includes('bn');
    }

    get isBnOrNat () {
        return this.groups && (this.groups.includes('bn') || this.groups.includes('nat'));
    }

    get hasBasicAccess () {
        return this.groups && (this.groups.includes('bn') || this.groups.includes('nat') || this.groups.includes('gmt'));
    }

    get hasFullReadAccess () {
        return this.groups && (this.groups.includes('nat') || this.groups.includes('gmt'));
    }

    get isNatOrTrialNat () {
        return this.groups && (this.groups.includes('nat') || (this.groups.includes('bn') && this.isTrialNat));
    }

    // Modes
    get modes () {
        return this.modesInfo && this.modesInfo.map(m => m.mode);
    }

    get fullModes () {
        return this.modesInfo && this.modesInfo.filter(m => m.level === 'full').map(m => m.mode);
    }

    get probationModes () {
        return this.modesInfo && this.modesInfo.filter(m => m.level === 'probation').map(m => m.mode);
    }

    // History
    get bnDuration () {
        return this.getDuration('bn');
    }

    get natDuration () {
        return this.getDuration('nat');
    }

    /**
     * @param {string} group
     * @returns {number} Duration in days
     */
    getDuration (group) {
        if (!this.history) return null;

        const bnHistory = this.history.filter(h => h.group === group);

        let historyKind;

        for (let i = 0; i < bnHistory.length; i++) {
            const history = bnHistory[i];

            if (historyKind !== history.kind) {
                historyKind = history.kind;
            } else {
                if (history.kind == 'joined') bnHistory.splice(i, 1);
                else if (history.kind == 'left') bnHistory.splice(i+1, 1);
            }

        }

        const joinedHistory = bnHistory.filter(h => h.kind === 'joined');
        const leftHistory = bnHistory.filter(h => h.kind === 'left');
        let bnDuration = 0;
        let unendingDate;

        for (const history of joinedHistory) {
            const i = leftHistory.findIndex(d => d.date > history.date && d.mode === history.mode);
            const leftDate = leftHistory[i];
            leftHistory.splice(i, 1);

            if (leftDate) {
                bnDuration += moment(leftDate.date).diff(history.date, 'days');
            } else {
                unendingDate = history.date;
            }
        }

        if (unendingDate) {
            bnDuration += moment().diff(unendingDate, 'days');
        }

        return bnDuration;
    }

    isBnFor (mode) {
        return this.modesInfo.some(m => m.mode === mode);
    }

    isFullBnFor (mode) {
        return this.modesInfo.some(m => m.mode === mode && m.level === 'full');
    }

    /**
     * Find an user by a given username
     * @param {string} username
     */
    static findByUsername (username) {
        return this.findOne({ username: new RegExp('^' + util.escapeUsername(username) + '$', 'i') });
    }

    /**
     * Find an user by a given username
     * @param {string} user
     */
    static findByUsernameOrOsuId (user) {
        const osuId = parseInt(user);

        if (isNaN(osuId)) {
            return User.findByUsername(user);
        } else {
            return User.findOne({ osuId });
        }
    }

    /**
     * @param {boolean} includeFullBns
     * @param {boolean} includeProbation
     * @param {boolean} includeNat
     * @returns {Promise<array|object>} [{ _id: 'osu', users: [{ id, username, osuId, group, level }] }]
     */
    static async getAllByMode (includeFullBns, includeProbation, includeNat) {
        if (!includeFullBns && !includeProbation && !includeNat) return [];

        try {
            let query = this.aggregate([
                {
                    $unwind: '$modesInfo',
                },
                {
                    $unwind: '$modesInfo.mode',
                },
                {
                    $unwind: '$groups',
                },
            ]);

            if (includeFullBns && includeProbation && includeNat) {
                query.match({
                    groups: { $in: ['bn', 'nat'] },
                });
            } else if ((includeFullBns || includeProbation) && !includeNat) {
                query.match({
                    groups: 'bn',
                });
            } else if (!includeFullBns && !includeProbation && includeNat) {
                query.match({
                    groups: 'nat',
                });
            }

            if (includeFullBns && !includeProbation) {
                query.match({
                    'modesInfo.level': 'full',
                });
            } else if (!includeFullBns && includeProbation) {
                query.match({
                    'modesInfo.level': 'probation',
                });
            }

            return await query.collation({ locale: 'en' }).sort({
                'groups': -1,
                'username': 1,
            }).group({
                _id: '$modesInfo.mode',
                users: {
                    $push: {
                        id: '$_id',
                        username: '$username',
                        osuId: '$osuId',
                        group: '$groups',
                        level: '$modesInfo.level',
                        requestStatus: '$requestStatus',
                        requestLink: '$requestLink',
                    },
                },
            });
        } catch (error) {
            return { error: error._message };
        }
    }

    static async getAllMediators () {
        try {
            return await this.aggregate([
                {
                    $match: {
                        groups: { $in: ['bn', 'nat'] },
                        isVetoMediator: true,
                        'modesInfo.level': 'full',
                    },
                },
                { $sample: { size: 1000 } },
            ]);
        } catch (error) {
            return { error: error._message };
        }
    }

    /**
     * Note that when doing evaluation.natEvaluators = assignedNats, natEvaluators will be an array of ObjectsIds, NOT an array users objects. Populate again to work with it.
     * @param {string} mode
     * @param {number[]} [excludeOsuIds]
     * @param {number} [sampleSize]
     * @returns {Promise<[]>}
     */
    static async getAssignedNat (mode, excludeOsuIds, sampleSize) {
        sampleSize = sampleSize || await Settings.getModeEvaluationsRequired(mode);

        const query = User.aggregate([
            {
                $match: {
                    groups: 'nat',
                    'modesInfo.mode': mode,
                    isBnEvaluator: true,
                    inBag: true,
                },
            },
        ]);

        if (excludeOsuIds) {
            query.match({
                osuId: { $nin: excludeOsuIds },
            });
        }

        let assignedNat = await query
            .sample(sampleSize)
            .exec();

        let uniqueAssignedNatIds = [];
        let uniqueAssignedNat = [];

        for (const user of assignedNat) {
            if (!uniqueAssignedNatIds.includes(user.id)) {
                uniqueAssignedNatIds.push(user.id);
                uniqueAssignedNat.push(user);
            }
        }

        let finalAssignedNat = [];

        if (uniqueAssignedNatIds.length < sampleSize) {
            const relevantNat = await User.find({
                groups: 'nat',
                'modesInfo.mode': mode,
                isBnEvaluator: true,
                inBag: { $ne: true },
            });

            for (const user of relevantNat) {
                if (!uniqueAssignedNatIds.includes(user.id)) {
                    await User.findByIdAndUpdate(user._id, { inBag: true });
                }
            }

            let additionalAssignedNat = await query
                .sample(sampleSize - uniqueAssignedNatIds.length)
                .exec();

            finalAssignedNat = uniqueAssignedNat.concat(additionalAssignedNat);
        } else {
            finalAssignedNat = uniqueAssignedNat;
        }

        for (const user of finalAssignedNat) {
            await User.findByIdAndUpdate(user._id, { inBag: false });
        }

        return finalAssignedNat;
    }

    /**
     * Note that when doing evaluation.natEvaluators = assignedNats, natEvaluators will be an array of ObjectsIds, NOT an array users objects. Populate again to work with it.
     * @param {string} mode
     * @param {number[]} [excludeOsuIds]
     * @param {number} [sampleSize]
     * @returns {Promise<[]>}
     */
    static async getAssignedTrialNat (mode, excludeOsuIds, sampleSize) {
        sampleSize = sampleSize || await Settings.getModeEvaluationsRequired(mode);

        const query = User.aggregate([
            {
                $match: {
                    groups: 'bn',
                    'modesInfo.mode': mode,
                    isBnEvaluator: true,
                    isTrialNat: true,
                },
            },
        ]);

        if (excludeOsuIds) {
            query.match({
                osuId: { $nin: excludeOsuIds },
            });
        }

        return await query
            .sample(sampleSize)
            .exec();
    }

}

userSchema.loadClass(UserService);
/**
 * @type {import('./interfaces/user').IUserModel}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
