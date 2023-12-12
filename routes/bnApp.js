const express = require('express');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const { getUserModsCount } = require('../helpers/scrap');
const osu = require('../helpers/osu');
const AppEvaluation = require('../models/evaluations/appEvaluation.js');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const Logger = require('../models/log.js');
const TestSubmission = require('../models/bnTest/testSubmission');
const ResignationEvaluation = require('../models/evaluations/resignationEvaluation');
const { ResignationConsensus, BnEvaluationAddition } = require('../shared/enums');
const moment = require('moment');
const User = require('../models/user');
const Settings = require('../models/settings');
const discord = require('../helpers/discord');

const router = express.Router();

router.use(middlewares.isLoggedIn);

/* GET bn app page */
router.get('/relevantInfo', async (req, res) => {
    const oneYearAgo = moment().subtract(1, 'years').toDate();

    let [pendingTest, resignations, cooldownApps, cooldownEvals, cooldownResignations] = await Promise.all([
        TestSubmission
            .findOne({
                applicant: req.session.mongoId,
                status: { $ne: 'finished' },
            }),
        ResignationEvaluation
            .find({
                user: req.session.mongoId,
                active: false,
                consensus: ResignationConsensus.ResignedOnGoodTerms,
                archivedAt: { $gt: oneYearAgo },
                cooldownDate: { $lt: new Date() }
            })
            .sort({
                createdAt: -1
            }),
        AppEvaluation.find({
            user: req.session.mongoId,
            $or: [
                { cooldownDate: { $gt: new Date() } },
                { active: true },
            ],
        }),
        BnEvaluation.find({
            user: req.session.mongoId,
            consensus: 'removeFromBn',
            cooldownDate: { $gt: new Date() },
        }),
        ResignationEvaluation.find({
            user: req.session.mongoId,
            active: false,
            cooldownDate: { $gt: new Date() }
        }),
    ]);

    res.json({
        hasPendingTest: Boolean(pendingTest),
        resignations,
        cooldownApps,
        cooldownEvals,
        cooldownResignations,
    });
});

/* POST apply for BN */
router.post('/apply', async (req, res) => {
    const { mods, reasons, oszs, mode } = req.body;

    if (res.locals.userRequest.modes.includes(mode)) {
        return res.json({
            error: `You're already a BN for this game mode!`,
        });
    }

    if (res.locals.userRequest.isBannedFromBn) {
        return res.json({
            error: `You're currently banned from joining the BN. Contact support@ppy.sh for details`
        });
    }

    // validate user input
    if (!mods || !mods.length || !Array.isArray(mods) ||
        !reasons || !reasons.length || !Array.isArray(reasons) ||
        !oszs || !oszs.length || !Array.isArray(oszs) ||
        !mode
    ) {
        return res.json({ error: 'All fields must be completed!' });
    }

    const wasBn = res.locals.userRequest.history && res.locals.userRequest.history.length;

    if (mods.length !== 3 && !wasBn) {
        return res.json({ error: `You must enter three mods!` });
    } else if (mods.length < 2) {
        return res.json({ error: `You must enter at least two mods!` });
    }

    for (let i = 0; i < mods.length; i++) {
        mods[i] = mods[i].trim();
        reasons[i] = reasons[i] && reasons[i].trim();
        oszs[i] = oszs[i] && oszs[i].trim();

        util.isValidUrlOrThrow(mods[i], 'https://osu.ppy.sh/beatmapsets', `One of your mod links is not valid`);

        if (!reasons[i]) {
            return res.json({
                error: `Must to write something in the "reason" field for each mod`,
            });
        }

        if (!oszs[i]) {
            return res.json({
                error: `Must to write something in the ".osz" field for each mod`,
            });
        }
    }

    // begin checks
    const [currentBnApp, currentBnEval, lastCurrentBnEval, cooldownResignation] = await Promise.all([
        AppEvaluation.findOne({
            user: req.session.mongoId,
            mode,
            $or: [
                { cooldownDate: { $gt: new Date() } },
                { active: true },
            ],
        }),
        BnEvaluation.findOne({
            user: req.session.mongoId,
            mode,
            consensus: 'removeFromBn',
            cooldownDate: { $gt: new Date() },
        }),
        BnEvaluation
            .findOne({
                user: req.session.mongoId,
                mode,
                consensus: 'removeFromBn',
            })
            .sort({ createdAt: -1 }),
        ResignationEvaluation
            .findOne({
                user: req.session.mongoId,
                active: false,
                cooldownDate: { $gt: new Date() }
            })
            .sort({ createdAt: -1 }),
    ]);

    // deny if relevant app
    if (currentBnApp) {
        if (currentBnApp.active) {
            return res.json({ error: 'Your application is still being evaluated!' });
        } else {
            return res.json({
                error: `Your previous application was rejected (check your osu! messages for details). 
                        You may apply for this game mode again on 
                        ${new Date(currentBnApp.cooldownDate).toString().slice(4, 24)}.`,
            });
        }
    }

    // deny if relevant current bn eval
    if (currentBnEval) {
        return res.json({
            error: `You were recently removed from the Beatmap Nominators in this game mode. 
                    You may apply for this game mode again on 
                    ${new Date(currentBnEval.cooldownDate).toString().slice(4, 24)}.`,
        });
    }

    // deny if relevant current bn eval
    if (cooldownResignation) {
        return res.json({
            error: `You recently resigned the Beatmap Nominators in this game mode. 
                    You may apply for this game mode again on 
                    ${new Date(cooldownResignation.cooldownDate).toString().slice(4, 24)}.`,
        });
    }

    // check user kudosu total count
    const userInfo = await osu.getUserInfo(req.session.accessToken);

    if (!userInfo || userInfo.error) {
        return res.json({ error: 'Something went wrong! Please retry again.' });
    }

    const requiredKudosu = 150;

    // deny if not enough kudosu
    if (userInfo.kudosu.total < requiredKudosu) {
        return res.json({ error: `You do not meet the required ${requiredKudosu} kudosu to apply. You currently have ${userInfo.kudosu.total} kudosu.` });
    }

    // check if user has sufficient modding activity (only relevant if removed for activity in the past)
    const kickedForActivity = lastCurrentBnEval && lastCurrentBnEval.addition === BnEvaluationAddition.LowActivityWarning;

    if (kickedForActivity && mode !== 'catch') {
        const modsCount = await getUserModsCount(req.session.accessToken, req.session.username, 2); // 2 months of mods
        const reducer = (accumulator, currentValue) => accumulator + currentValue;
        const modsThreshold = 8;

        const totalMods = modsCount.reduce(reducer);

        if (totalMods < modsThreshold) {
            return res.json({ error: `You need at least ${modsThreshold} mods within the last 60 days to apply because you were recently removed for low activity!` } );
        }
    }

    // create app & test
    const [newBnApp, test] = await Promise.all([
        AppEvaluation.create({
            user: req.session.mongoId,
            mode,
            mods,
            reasons,
            oszs,
        }),
        TestSubmission.generateTest(req.session.mongoId, mode),
    ]);

    if (!newBnApp || !test) {
        return res.json({ error: 'Failed to process application!' });
    }

    // proceed
    res.json({
        success: 'Applied',
    });

    Logger.generate(req.session.mongoId, `Applied for ${mode} BN`, 'application', newBnApp._id);
});

/* POST request to rejoin bn */
router.post('/rejoinApply', async (req, res) => {
    const mode = req.body.mode;

    if (res.locals.userRequest.modes.includes(mode)) {
        return res.json({
            error: `You're already a BN for this game mode!`,
        });
    }
    
    const oneYearAgo = moment().subtract(1, 'years').toDate();

    const [cooldownApp, cooldownEval, lastResignation] = await Promise.all([
        AppEvaluation.findOne({
            user: req.session.mongoId,
            mode,
            $or: [
                { cooldownDate: { $gt: new Date() } },
                { active: true },
            ],
        }),
        BnEvaluation.findOne({
            user: req.session.mongoId,
            mode,
            consensus: 'removeFromBn',
            cooldownDate: { $gt: new Date() },
        }),
        ResignationEvaluation
            .findOne({
                user: req.session.mongoId,
                active: false,
                mode,
                consensus: ResignationConsensus.ResignedOnGoodTerms,
                archivedAt: { $gt: oneYearAgo },
                cooldownDate: { $lt: new Date() }
            })
            .sort({
                createdAt: -1
            }),
    ]);

    // security for people who try to circumvent front-end
    if (cooldownApp || cooldownEval || !lastResignation) { 
        return res.json({ 
            error: `You are not eligible to re-join right now.`
        });
    }

    // create app & test
    const [newBnApp, test] = await Promise.all([
        AppEvaluation.create({
            user: req.session.mongoId,
            mode,
            mods: [],
            reasons: [],
            oszs: [],
        }),
        TestSubmission.generateTest(req.session.mongoId, mode),
    ]);

    if (!newBnApp || !test) {
        return res.json({ error: 'Failed to process application!' });
    }

    newBnApp.isRejoinRequest = true;
    
    // skip test
    test.status = 'finished';
    test.submittedAt = new Date;
    test.totalScore = 0;
    newBnApp.test = test._id;

    // assign NAT
    const assignedNat = await User.getAssignedNat(test.mode, req.session.mongoId);
    newBnApp.natEvaluators = assignedNat;

    const assignments = [];

    const days = util.findDaysBetweenDates(new Date(), new Date(newBnApp.deadline));

    for (const user of assignedNat) {
        assignments.push({
            date: new Date(),
            user: user._id,
            daysOverdue: days,
        });
    }

    newBnApp.natEvaluatorHistory = assignments;

    let fields = [];
    const natList = assignedNat.map(n => n.username).join(', ');

    fields.push({
        name: 'Assigned NAT',
        value: natList,
    });

    // assign trial NAT
    if (await Settings.getModeHasTrialNat(test.mode)) {
        const assignedTrialNat = await User.getAssignedTrialNat(test.mode);
        newBnApp.bnEvaluators = assignedTrialNat;
        const trialNatList = assignedTrialNat.map(n => n.username).join(', ');
        fields.push({
            name: 'Assigned BN',
            value: trialNatList,
        });
    }

    // save
    await Promise.all([
        test.save(),
        newBnApp.save(),
    ]);

    // proceed
    res.json({
        success: 'Applied',
    });

    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            description: `Requested to re-join ${mode == 'osu' ? 'osu!' : 'osu!' + mode} BN after recent resignation. See [BN application](http://bn.mappersguild.com/appeval?id=${newBnApp.id})`,
            color: discord.webhookColors.lightYellow,
            fields,
        }],
        mode
    );

    Logger.generate(req.session.mongoId, `Applied for ${mode} BN`, 'application', newBnApp._id);
    
});

module.exports = router;
