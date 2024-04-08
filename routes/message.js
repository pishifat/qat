const express = require('express');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');
const osuBot = require('../helpers/osuBot');
const util = require('../helpers/util');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const Evaluation = require('../models/evaluations/evaluation');
const Report = require('../models/report');
const Veto = require('../models/veto');

const router = express.Router();

router.use(middlewares.isLoggedIn);

// population
const appPopulateOld = [
    { path: 'user', select: 'username osuId' },
    { path: 'natBuddy', select: 'username osuId' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    {
        path: 'reviews',
        select: 'evaluator',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat discordId',
        },
    },
];

const appPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'natBuddy', select: 'username osuId' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    {
        path: 'reviews',
        populate: {
            path: 'evaluator',
            select: 'groups isTrialNat',
        },
    },
];

const bnEvalPopulateOld = [
    { path: 'user', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    {
        path: 'reviews',
        select: 'evaluator',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat',
        },
    },
];

const bnEvalPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    {
        path: 'reviews',
        populate: {
            path: 'evaluator',
            select: 'groups isTrialNat',
        },
    },
];

const reportPopulate = [
    { path: 'culprit', select: 'username osuId' },
    { path: 'reporter', select: 'username osuId' },
];

const vetoPopulate = [
    { 
        path: 'mediations',
        select: 'comment vote reasonIndex',
    },
];

const vetoPrivatePopulate = [
    { 
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId groups',
        },
    },
];

/* GET evaluation results by ID */
router.get('/evaluation/:id', async (req, res) => {
    let query;
    const isNatOrTrialNat = res.locals.userRequest.isNat || res.locals.userRequest.isTrialNat;

    if (isNatOrTrialNat) query = { _id: req.params.id };
    else query = { _id: req.params.id, active: false };

    let evaluation;

    /*
        * in march 2024, the evaluation message changed to show evaluator's individual comments, but not attach their names
        * i don't know which format an eval uses (or whether it's an app or an eval) until after an initial query, so querying all at once is actually most efficient, despite looking dumb
        * anyway, the new format requires a query that hides evaluator names, which is the "evaluation" returned to the user (app, eval)
        *buuuut the message page also shows the NAT who were involved (not directly tied to their evals), so those need to be fetched somehow. using the old format's population works, so this is (again, stupidly) efficient
    */
    const [appOldPopulate, app, evalOldPopulate, eval] = await Promise.all([
        AppEvaluation.findOne(query).populate(appPopulateOld),
        AppEvaluation.findOne(query).populate(appPopulate),
        Evaluation.findOne(query).populate(bnEvalPopulateOld),
        Evaluation.findOne(query).populate(bnEvalPopulate)
    ]);

    if (appOldPopulate) evaluation = appOldPopulate;
    else if (evalOldPopulate) evaluation = evalOldPopulate;

    if (evaluation.isNewEvaluationFormat) {
        if (app) evaluation = app;
        else if (eval) evaluation = eval;
    }

    let natUserList;
    
    if (evaluation.kind == 'application') {
        natUserList = appOldPopulate.reviews.map(r => r.evaluator);
    } else {
        natUserList = evalOldPopulate.reviews.map(r => r.evaluator);
    }

    return res.json({
        evaluation,
        isNewEvaluationFormat: evaluation.isNewEvaluationFormat,
        natUserList: isNatOrTrialNat ? natUserList : util.shuffleArray(natUserList),
    });
});

/* GET report by ID */
router.get('/report/:id', async (req, res) => {
    return res.json(await Report.findById(req.params.id).populate(reportPopulate));
});

/* GET veto by ID */
router.get('/veto/:id', async (req, res) => {
    const veto = await Veto.findById(req.params.id).populate(vetoPopulate);

    return res.json(veto);
});

/* GET veto mediators */
router.get('/vetoMediators/:id', async (req, res) => {
    const veto = await Veto.findById(req.params.id).populate(vetoPrivatePopulate);

    const users = [];
    const userOsuIds = [];

    for (const mediation of veto.mediations) {
        if (!userOsuIds.includes(mediation.mediator.osuId)) {
            userOsuIds.push(mediation.mediator.osuId);
            users.push({
                osuId: mediation.mediator.osuId,
                username: mediation.mediator.username,
                groups: mediation.mediator.groups,
            });
        }
    }

    return res.json(users.sort(() => .5 - Math.random()));
});

/* POST submit message */
router.post('/submitEvaluationMessage/:id', async (req, res) => {
    let evaluation;
    const id = req.params.id;
    const newMessage = req.body.message;

    const [appOldPopulate, app, evalOldPopulate, eval] = await Promise.all([
        AppEvaluation.findById(id).populate(appPopulateOld),
        AppEvaluation.findById(id).populate(appPopulate),
        Evaluation.findById(id).populate(bnEvalPopulateOld),
        Evaluation.findById(id).populate(bnEvalPopulate)
    ]);

    if (app) evaluation = app;
    else if (eval) evaluation = evaluation;
    else if (appOldPopulate) evaluation = appOldPopulate;
    else if (evalOldPopulate) evaluation = evalOldPopulate;

    evaluation.messagesLocked = false;
    evaluation.messages.push({
        date: new Date(),
        content: newMessage,
        isNat: req.session.groups.includes('nat'),
    });
    
    await evaluation.save();

    let discordIds;

    if (evaluation.kind == 'application') {
        discordIds = appOldPopulate.reviews.map(r => r.evaluator.discordId);
    } else {
        discordIds = evalOldPopulate.reviews.map(r => r.evaluator.discordId);
    }

    if (req.session.groups.includes('nat')) {
        const channel = {
            name: 'Evaluation response',
            description: 'Response from the NAT about your recent evaluation',
        }
    
        const message = await osuBot.sendAnnouncement([evaluation.user.osuId, req.session.osuId], channel, newMessage + `\n\nVisit https://bn.mappersguild.com/message?eval=${evaluation.id} to reply`);
    
        if (message !== true) {
            return res.json({ error: `Messages were not sent. Please let pishifat know!` });
        }
    } else {
        await discord.webhookPost(
            [{
                color: discord.webhookColors.darkBlue,
                description: `Response received on [**${evaluation.user.username}**'s ${evaluation.isApplication ? 'application' : 'current BN eval'}](http://bn.mappersguild.com/message?eval=${evaluation.id})`,
            }],
            evaluation.mode,
        );
        await discord.userHighlightWebhookPost(evaluation.mode, discordIds);    
    }

    return res.json(evaluation.messages);
});

/* POST toggle messagesLocked on evaluations */
router.post('/toggleMessagesLocked/:id', middlewares.isNat, async (req, res) => {
    let evaluation;
    const id = req.params.id;

    const [appOldPopulate, app, evalOldPopulate, eval] = await Promise.all([
        AppEvaluation.findById(id).populate(appPopulateOld),
        AppEvaluation.findById(id).populate(appPopulate),
        Evaluation.findById(id).populate(bnEvalPopulateOld),
        Evaluation.findById(id).populate(bnEvalPopulate)
    ]);

    if (app) evaluation = app;
    else if (eval) evaluation = evaluation;
    else if (appOldPopulate) evaluation = appOldPopulate;
    else if (evalOldPopulate) evaluation = evalOldPopulate;

    evaluation.messagesLocked = !evaluation.messagesLocked;

    await evaluation.save();

    return res.json(evaluation);
});

module.exports = router;
