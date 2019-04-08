const express = require('express');
const api = require('../models/api');
const vetoesService = require('../models/veto').service;
const usersService = require('../models/user').service;
const usersModel = require('../models/user').User;
const mediationsService = require('../models/mediation').service;
const logsService = require('../models/log').service;

const router = express.Router();

const defaultPopulate = [
    { populate: 'vetoer', display: 'username osuId' },
    { innerPopulate: 'mediations', populate: { path: 'mediator', select: 'username osuId' } },
];

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('vetoes', {
        title: 'Vetoes',
        script: '../javascripts/vetoes.js',
        isVetoes: true,
        isBnOrNat: true,
        isNat: res.locals.userRequest.group == 'nat',
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    let v = await vetoesService.query({}, defaultPopulate, { createdAt: 1 }, true);
    res.json({ vetoes: v, userId: req.session.mongoId, userGroup: res.locals.userRequest.group });
});

/* POST create a new veto. */
router.post('/submit', async (req, res, next) => {
    let url = req.body.discussionLink;
    if (url.length == 0) {
        url = undefined;
    }

    const regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if (!regexp.test(url) || url.indexOf('osu.ppy.sh/beatmapsets/') == -1) {
        return res.json({ error: 'Not a valid URL' });
    }

    let indexStart = url.indexOf('beatmapsets/') + 'beatmapsets/'.length;
    let indexEnd = url.indexOf('#');
    let bmId;

    if (indexEnd !== -1) {
        bmId = url.slice(indexStart, indexEnd);
    } else {
        bmId = url.slice(indexStart);
    }

    const bmInfo = await api.beatmapsetInfo(bmId);
    if (!bmInfo || bmInfo.error) {
        return res.json(bmInfo);
    }

    const v = await vetoesService.create(
        req.session.mongoId,
        req.body.discussionLink,
        bmInfo.beatmapset_id,
        bmInfo.artist + ' - ' + bmInfo.title,
        bmInfo.creator,
        bmInfo.creator_id,
        req.body.shortReason,
        req.body.mode
    );
    res.json(v);
    logsService.create(req.session.mongoId, `Submitted a veto for mediation on "${v.beatmapTitle}"`);
});

/* POST set status upheld or withdrawn. */
router.post('/selectMediators', async (req, res, next) => {
    const allUsers = await usersModel.aggregate([
        { $match: { group: { $ne: 'user' }, vetoMediator: true} },
        { $sample: { size: 1000 } },
    ]);
    let usernames = [];
    for (let i = 0; i < allUsers.length; i++) {
        let user = allUsers[i];
        if (
            user.modes.indexOf(req.body.mode) >= 0 &&
            user.probation.indexOf(req.body.mode) < 0 &&
            req.body.excludeUsers.indexOf(user.username.toLowerCase()) < 0
        ) {
            usernames.push(user);
            if (usernames.length >= 12) {
                break;
            }
        }
    }
    res.json(usernames);
});

/* POST begin mediation */
router.post('/beginMediation/:id', async (req, res, next) => {
    for (let i = 0; i < req.body.mediators.length; i++) {
        let mediator = req.body.mediators[i];
        let m = await mediationsService.create(mediator._id);
        await vetoesService.update(req.params.id, { $push: { mediations: m }, status: 'wip' });
    }
    let v = await vetoesService.query({ _id: req.params.id }, defaultPopulate);
    res.json(v);
    logsService.create(
        req.session.mongoId,
        `Started veto mediation for "${v.beatmapTitle}"`
    );
});

/* POST submit mediation */
router.post('/submitMediation/:id', async (req, res, next) => {
    await mediationsService.update(req.body.mediationId, { comment: req.body.comment, vote: req.body.vote });
    let v = await vetoesService.query({ _id: req.params.id }, defaultPopulate);
    res.json(v);
    logsService.create(
        req.session.mongoId,
        `Submitted "${req.body.vote == 1 ? 'agree' : req.body.vote == 2 ? 'neutral' : 'disagree'}" vote for veto on "${v.beatmapTitle}"`
    );
});

/* POST submit mediation */
router.post('/concludeMediation/:id', async (req, res, next) => {
    await vetoesService.update(req.params.id, { status: req.body.majority ? 'upheld' : 'withdrawn' });
    let v = await vetoesService.query({ _id: req.params.id }, defaultPopulate);
    res.json(v);
    logsService.create(
        req.session.mongoId,
        `${v.status.charAt(0).toUpperCase() + v.status.slice(1)} veto mediation for "${v.beatmapTitle}"`
    );
});

module.exports = router;
