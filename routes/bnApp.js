const express = require('express');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const osu = require('../helpers/osu');
const AppEvaluation = require('../models/evaluations/appEvaluation.js');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const Logger = require('../models/log.js');
const ResignationEvaluation = require('../models/evaluations/resignationEvaluation');
const { ResignationConsensus } = require('../shared/enums');
const moment = require('moment');
const User = require('../models/user');
const Settings = require('../models/settings');
const discord = require('../helpers/discord');

const router = express.Router();

router.use(middlewares.isLoggedIn);

/* GET bn app page */
router.get('/relevantInfo', async (req, res) => {
    const oneYearAgo = moment().subtract(1, 'years').toDate();

    let [resignations, activeApps, cooldownApps, cooldownEvals, cooldownResignations] = await Promise.all([
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
            active: true,
        }).select('-natEvaluators -bnEvaluators'),
        AppEvaluation.find({
            user: req.session.mongoId,
            active: false,
            cooldownDate: { $gt: new Date() },
        }),
        BnEvaluation.find({
            user: req.session.mongoId,
            consensus: 'removeFromBn',
            active: false,
            cooldownDate: { $gt: new Date() },
        }),
        ResignationEvaluation.find({
            user: req.session.mongoId,
            active: false,
            cooldownDate: { $gt: new Date() }
        }),
    ]);

    res.json({
        resignations,
        activeApps,
        cooldowns: [].concat(cooldownApps, cooldownEvals, cooldownResignations),
    });
});

/* POST apply for BN */
router.post('/apply', async (req, res) => {
    const { mods, reasons, oszs, mode, comment, isPublic } = req.body;

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

        const blockedUrls = [
            'puu.sh',
            'cdn.discordapp.com'
        ];

        if (blockedUrls.some(url => oszs[i].includes(url))) {
            const url = new URL(oszs[i]).hostname;
            return res.json({
                error: `Files hosted on ${url} are not allowed as they can expire quickly. Please use a different file host.`
            });
        }
    }

    // begin checks

    // get user's osu! information
    const userInfo = await osu.getUserInfo(req.session.accessToken);

    if (!userInfo || userInfo.error) {
        return res.json({ error: 'Something went wrong! Please retry again.' });
    }

    // check for silences
    const accountHistory = userInfo.account_history;

    // deny if there's a silence longer than 42 hours
    if (accountHistory.length) {
        const silenceThreshold = 153600; // 42 hours

        for (const silence of accountHistory) {
            if (silence.length >= silenceThreshold) {
                return res.json({
                    error: 'You have a recent silence that is too long to apply for BN. Please wait until it\'s removed from your account history.',
                });
            }
        }
    }

    // check user kudosu total count
    const requiredKudosu = 150;

    // deny if not enough kudosu
    if (userInfo.kudosu.total < requiredKudosu) {
        return res.json({ error: `You do not meet the required ${requiredKudosu} kudosu to apply. You currently have ${userInfo.kudosu.total} kudosu.` });
    }

    const [currentBnApp, currentBnEval, cooldownResignation] = await Promise.all([
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
                mode,
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

    // deny if relevant resignation
    if (cooldownResignation) {
        return res.json({
            error: `You recently resigned the Beatmap Nominators in this game mode. 
                    You may apply for this game mode again on 
                    ${new Date(cooldownResignation.cooldownDate).toString().slice(4, 24)}.`,
        });
    }

    // create app
    const newBnApp = await AppEvaluation.create({
            user: req.session.mongoId,
            mode,
            mods,
            reasons,
            oszs,
            comment,
            isPublic,
        });

    if (!newBnApp) {
        return res.json({ error: 'Failed to process application!' });
    }

    // set NAT assignments
    const assignedNat = await User.getAssignedNat(mode, req.session.mongoId);
    newBnApp.natEvaluators = assignedNat;

    let fields = [];
    let discordIds = [];

    const natList = assignedNat.map(n => n.username).join(', ');
    const natDiscordIds = assignedNat.map(n => n.discordId);
    discordIds = discordIds.concat(natDiscordIds);

    fields.push({
        name: 'Assigned NAT',
        value: natList,
    });

    // set trialNat assignments
    if (await Settings.getModeHasTrialNat(mode)) {
        const assignedTrialNat = await User.getAssignedTrialNat(mode);
        newBnApp.bnEvaluators = assignedTrialNat;
        const trialNatList = assignedTrialNat.map(n => n.username).join(', ');
        const trialNatDiscordIds = assignedTrialNat.map(n => n.discordId);
        fields.push({
            name: 'Assigned BN',
            value: trialNatList,
        });
        discordIds = discordIds.concat(trialNatDiscordIds);
    }

    // save all assignments
    await newBnApp.save();

    // NAT webhook
    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            description: `Submitted [BN application](http://bn.mappersguild.com/appeval?id=${newBnApp.id})`,
            color: discord.webhookColors.green,
            fields,
        }],
        mode
    );

    await discord.userHighlightWebhookPost(mode, discordIds);

    await util.sleep(500);

    // security check webhook
    const embed = [{
        author: discord.defaultWebhookAuthor(req.session),
        description: `Submitted a BN application`,
        color: discord.webhookColors.green,
        fields,
    }];

    const securityCheckMessage = `Please conduct a BN security check on [**${userInfo.username}**](<https://osu.ppy.sh/users/${userInfo.id}>), then inform any of the assigned NAT below.`

    await discord.highlightWebhookPost(securityCheckMessage, embed, 'securityCheck');

    // proceed
    res.json(newBnApp);

    // logs
    Logger.generate(
        req.session.mongoId,
        `Applied for ${mode} BN`,
        'application',
        newBnApp._id
    );
});

/* POST request to rejoin bn */
router.post('/rejoinApply', async (req, res) => {
    const mode = req.body.mode;

    if (res.locals.userRequest.modes.includes(mode)) {
        return res.json({
            error: `You're already a BN for this game mode!`,
        });
    }

    // get user's osu! information
    const userInfo = await osu.getUserInfo(req.session.accessToken);

    if (!userInfo || userInfo.error) {
        return res.json({ error: 'Something went wrong! Please retry again.' });
    }

    // check for silences
    const accountHistory = userInfo.account_history;

    // deny if there's a silence longer than 42 hours
    if (accountHistory.length) {
        const silenceThreshold = 153600; // 42 hours

        for (const silence of accountHistory) {
            if (silence.length >= silenceThreshold) {
                return res.json({
                    error: 'You have a recent silence that is too long to apply for BN. Please wait until it\'s removed from your account history.',
                });
            }
        }
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

    // create app
    const newBnApp = await AppEvaluation.create({
            user: req.session.mongoId,
            mode,
            mods: [],
            reasons: [],
            oszs: [],
            isRejoinRequest: true,
        });

    if (!newBnApp) {
        return res.json({ error: 'Failed to process application!' });
    }

    // assign NAT
    const assignedNat = await User.getAssignedNat(mode, req.session.mongoId);
    newBnApp.natEvaluators = assignedNat;

    let fields = [];
    let discordIds = [];

    const natList = assignedNat.map(n => n.username).join(', ');
    const natDiscordIds = assignedNat.map(n => n.discordId);
    discordIds = discordIds.concat(natDiscordIds);

    fields.push({
        name: 'Assigned NAT',
        value: natList,
    });

    // assign trial NAT
    if (await Settings.getModeHasTrialNat(mode)) {
        const assignedTrialNat = await User.getAssignedTrialNat(mode);
        newBnApp.bnEvaluators = assignedTrialNat;
        const trialNatList = assignedTrialNat.map(n => n.username).join(', ');
        const trialNatDiscordIds = assignedTrialNat.map(n => n.discordId);
        fields.push({
            name: 'Assigned BN',
            value: trialNatList,
        });
        discordIds = discordIds.concat(trialNatDiscordIds);
    }

    // save
    await newBnApp.save();

    // NAT webhook
    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            description: `Requested to re-join ${util.formatMode(mode)} BN after recent resignation. See [BN application](http://bn.mappersguild.com/appeval?id=${newBnApp.id})`,
            color: discord.webhookColors.lightYellow,
            fields,
        }],
        mode
    );

    await discord.userHighlightWebhookPost(mode, discordIds);

    await util.sleep(500);

    // security check webhook
    const embed = [{
        author: discord.defaultWebhookAuthor(req.session),
        description: `Requested to re-join ${util.formatMode(mode)} BN after recent resignation.`,
        color: discord.webhookColors.lightYellow,
        fields,
    }];

    const securityCheckMessage = `Please conduct a BN security check on [**${userInfo.username}**](<https://osu.ppy.sh/users/${userInfo.id}>), then inform any of the assigned NAT below.`

    await discord.highlightWebhookPost(securityCheckMessage, embed, 'securityCheck');

    // proceed
    res.json(newBnApp);

    Logger.generate(req.session.mongoId, `Requested to re-join ${mode} BN`, 'application', newBnApp._id);
    
});

module.exports = router;
