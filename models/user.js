const mongoose = require('mongoose');
const util = require('../helpers/util');
const moment = require('moment');
const Settings = require('./settings');
const enums = require('../shared/enums');
const config = require('../config.json');
const Evaluation = require('./evaluations/evaluation');


const userSchema = new mongoose.Schema({
    osuId: { type: Number, required: true },
    username: { type: String, required: true },
    groups: [{ type: String, enum: ['user', 'bn', 'nat', 'gmt'], default: ['user'] }],
    modesInfo: [{
        _id: false,
        mode: { type: String, enum: ['osu', 'taiko', 'catch', 'mania', 'none'], required: true },
        level: { type: String, enum: ['full', 'probation', 'evaluator'], required: true },
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
    isBannedFromBn: { type: Boolean, default: false },
    isNatLeader: { type: Boolean, default: false },
    bnProfileBadge: { type: Number, default: 0 },
    natProfileBadge: { type: Number, default: 0 },
    nominationsProfileBadge: { type: Number, default: 0 },
    rankedBeatmapsets: { type: Number, default: 0 },
    discordId: { type: String },
    requestStatus: [{ type: String, enum: ['gameChat', 'personalQueue', 'closed'] }],
    genrePreferences: [{ type: String, enum: enums.GenrePreferences }],
    genreNegativePreferences: [{ type: String, enum: enums.GenrePreferences }],
    languagePreferences: [{ type: String, enum: enums.LanguagePreferences }],
    languageNegativePreferences: [{ type: String, enum: enums.LanguagePreferences }],
    osuStylePreferences: [{ type: String, enum: enums.OsuStylePreferences }],
    osuStyleNegativePreferences: [{ type: String, enum: enums.OsuStylePreferences }],
    taikoStylePreferences: [{ type: String, enum: enums.TaikoStylePreferences }],
    taikoStyleNegativePreferences: [{ type: String, enum: enums.TaikoStylePreferences }],
    catchStylePreferences: [{ type: String, enum: enums.CatchStylePreferences }],
    catchStyleNegativePreferences: [{ type: String, enum: enums.CatchStylePreferences }],
    maniaStylePreferences: [{ type: String, enum: enums.ManiaStylePreferences }],
    maniaStyleNegativePreferences: [{ type: String, enum: enums.ManiaStylePreferences }],
    maniaKeymodePreferences: [{ type: String, enum: enums.ManiaKeymodePreferences }],
    maniaKeymodeNegativePreferences: [{ type: String, enum: enums.ManiaKeymodePreferences }],
    detailPreferences: [{ type: String, enum: enums.DetailPreferences }],
    detailNegativePreferences: [{ type: String, enum: enums.DetailPreferences }],
    mapperPreferences: [{ type: String, enum: enums.MapperPreferences }],
    mapperNegativePreferences: [{ type: String, enum: enums.MapperPreferences }],
    requestLink: { type: String },
    languages: [{ type: String, enum: enums.Languages, default: [] }],
    lastMarkedAsLowActivity: { type: Date },
    showExplicitContent: { type: Boolean, default: false },
    cover: { type: String },
    requestInfo: { type: String },
    lastOpenedForRequests: { type: Date },
    isActiveContentReviewer: { type: Boolean, default: false },

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

    get isPishifat () {
        return this.osuId === config.admin.pishifat;
    }

    get isResponsibleWithButtons () {
        return config.admin.users.includes(this.osuId);
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

    get evaluatorModes () {
        return this.modesInfo && this.modesInfo.filter(m => m.level === 'evaluator').map(m => m.mode);
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
                    $addFields: {
                        originalModesInfo: '$modesInfo', // Save the original array in a new field
                    }
                },
                {
                    $unwind: '$modesInfo',
                },
                {
                    $unwind: '$modesInfo.mode',
                },
                {
                    $unwind: '$modesInfo.level',
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
                'modesInfo.level': 1,
                'username': 1,
            }).group({
                _id: '$modesInfo.mode',
                users: {
                    $push: {
                        id: '$_id',
                        username: '$username',
                        osuId: '$osuId',
                        groups: '$groups',
                        level: '$modesInfo.level',
                        requestStatus: '$requestStatus',
                        requestLink: '$requestLink',
                        languages: '$languages',
                        cover: '$cover',
                        mode: '$modesInfo.mode',
                        modesInfo: '$originalModesInfo',
                        isNat: '$isNat',
                        hasBasicAccess: '$hasBasicAccess',
                        probationModes: '$probationModes',
                        requestInfo: '$requestInfo',
                        lastOpenedForRequests: '$lastOpenedForRequests',
                        genrePreferences: '$genrePreferences',
                        genreNegativePreferences: '$genreNegativePreferences',
                        languagePreferences: '$languagePreferences',
                        languageNegativePreferences: '$languageNegativePreferences',
                        osuStylePreferences: '$osuStylePreferences',
                        osuStyleNegativePreferences: '$osuStyleNegativePreferences',
                        taikoStylePreferences: '$taikoStylePreferences',
                        taikoStyleNegativePreferences: '$taikoStyleNegativePreferences',
                        catchStylePreferences: '$catchStylePreferences',
                        catchStyleNegativePreferences: '$catchStyleNegativePreferences',
                        maniaStylePreferences: '$maniaStylePreferences',
                        maniaStyleNegativePreferences: '$maniaStyleNegativePreferences',
                        maniaKeymodePreferences: '$maniaKeymodePreferences',
                        maniaKeymodeNegativePreferences: '$maniaKeymodeNegativePreferences',
                        detailPreferences: '$detailPreferences',
                        detailNegativePreferences: '$detailNegativePreferences',
                        mapperPreferences: '$mapperPreferences',
                        mapperNegativePreferences: '$mapperNegativePreferences',
                        history: '$history',
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
                        'modesInfo.level': { $ne: 'probation' },
                    },
                },
                { $sample: { size: 1000 } },
            ]);
        } catch (error) {
            return { error: error._message };
        }
    }

    static async getAllBnAndNat () {
        try {
            return await this.aggregate([
                {
                    $match: {
                        groups: { $in: ['bn', 'nat'] },
                    },
                },
                { $sample: { size: 1000 } },
            ]);
        } catch (error) {
            return { error: error._message };
        }
    }

    /**
     * 
     * @param {string} mode
     * @param {number[]} [excludeOsuIds]
     * @param {number} [sampleSize]
     * @param {boolean} [isNat]
     * @param {boolean} [isReset]
     * @returns {Promise<[]>}
     */
    static async queryAssignmentUsers (mode, excludeOsuIds, sampleSize, isNat, isReset) {
        // set query
        const query = User.aggregate([
            {
                $match: {
                    groups: isNat ? 'nat' : 'bn',
                    modesInfo: {
                        $elemMatch: {
                            mode: mode,
                            level: isNat ? 'evaluator' : 'full'
                        }
                    },
                    isBnEvaluator: true,
                    inBag: isReset ? false : true,
                    isTrialNat: isNat ? false : true,
                },
            },
        ]);

        // exclude anyone specified
        if (excludeOsuIds) {
            query.match({
                osuId: { $nin: excludeOsuIds },
            });
        }

        // execute
        const assignedNat = await query
            .sample(sampleSize)
            .exec();

        return assignedNat;
    }

    /**
     * Note that when doing evaluation.natEvaluators = assignedNats, natEvaluators will be an array of ObjectsIds, NOT an array users objects. Populate again to work with it.
     * @param {string} mode
     * @param {string} evaluatedUserId
     * @param {number[]} [excludeOsuIds]
     * @param {number} [sampleSize]
     * @returns {Promise<[]>}
     */
    static async getAssignedNat (mode, evaluatedUserId, excludeOsuIds, sampleSize) {
        // set samplesize if not already set
        if (!sampleSize) {
            sampleSize = await Settings.getModeHasTrialNat(mode) ? await Settings.getModeEvaluationsRequired(mode) - 1 : await Settings.getModeEvaluationsRequired(mode);
        }

        if (!excludeOsuIds) {
            excludeOsuIds = [];
        }

        // get user's last eval for this mode (if it exists)
        const lastEvaluation = await Evaluation
            .findOne({
                user: evaluatedUserId,
                active: false,
                mode: mode,
                consensus: { $exists: true },
            })
            .populate({ path: 'reviews', populate: 'evaluator' })
            .sort({ archivedAt: -1 });

        /* choose assigned nat. priority:
            - users who are still NAT and inBag and evaluated the user's last evaluation
            - anyone else in bag
        */
       let assignedNat = [];
            
        if (lastEvaluation) {
            for (const review of lastEvaluation.reviews) {
                if (assignedNat.length < sampleSize) {
                    if (review.evaluator.isNat && review.evaluator.inBag) {
                        assignedNat.push(review.evaluator);
                        excludeOsuIds.push(review.evaluator.osuId);
                    }
                }
            }

            // fill in the gaps, if any
            if (assignedNat.length < sampleSize) {
                const additionalAssignedNat = await this.queryAssignmentUsers(mode, excludeOsuIds, sampleSize - assignedNat.length, true, false);

                for (const user of additionalAssignedNat) {
                    excludeOsuIds.push(user.osuId);
                }

                assignedNat = assignedNat.concat(additionalAssignedNat);
            }
        } else {
            assignedNat = await this.queryAssignmentUsers(mode, excludeOsuIds, sampleSize, true, false);
        }

        /* if there's not enough users in the bag:
            - run query again
            - reset inBag for all NAT
        */
        if (assignedNat.length < sampleSize) {
            const additionalAssignedNat = await this.queryAssignmentUsers(mode, excludeOsuIds, 100, true, true);

            for (const user of additionalAssignedNat) {
                await User.findByIdAndUpdate(user._id, { inBag: true });

                if (assignedNat.length < sampleSize) {
                    assignedNat.push(user);
                }
            }
        }

        // remove users from bag if they're assigned to this eval
        for (const user of assignedNat) {
            await User.findByIdAndUpdate(user._id, { inBag: false });
        }

        return assignedNat;
    }

    /**
     * Note that when doing evaluation.natEvaluators = assignedNats, natEvaluators will be an array of ObjectsIds, NOT an array users objects. Populate again to work with it.
     * @param {string} mode
     * @param {number[]} [excludeOsuIds]
     * @param {number} [sampleSize]
     * @returns {Promise<[]>}
     */
    static async getAssignedTrialNat (mode, excludeOsuIds, sampleSize) {
        if (!sampleSize) {
            sampleSize = await Settings.getModeHasTrialNat(mode) ? await Settings.getModeEvaluationsRequired(mode) - 1 : await Settings.getModeEvaluationsRequired(mode);
        }

        return this.queryAssignmentUsers(mode, excludeOsuIds, sampleSize, false, false);
    }
}

userSchema.loadClass(UserService);
/**
 * @type {import('./interfaces/user').IUserModel}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
