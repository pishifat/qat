const express = require('express');
const api = require('../models/api');
const rcDiscussionsService = require('../models/rcDiscussion').service;
const mediationsService = require('../models/mediation').service;
const logsService = require('../models/log').service;

const router = express.Router();

const defaultPopulate = [
    { innerPopulate: 'mediations', populate: { path: 'mediator', select: 'username osuId' } },
];

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('rcvote', {
        title: 'Ranking Criteria Vote',
        script: '../javascripts/rcVote.js',
        isRcVote: true,
        isBnOrNat: true,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,        
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    let rc = await rcDiscussionsService.query({}, defaultPopulate, { createdAt: -1 }, true);
    res.json({ 
        rcDiscussions: rc, 
        userId: req.session.mongoId,
        userModes: res.locals.userRequest.modes,
        isSpectator: res.locals.userRequest.isSpectator,
        isLeader: res.locals.userRequest.isLeader
    });
});

/* POST create a new veto. */
router.post('/submit', async (req, res, next) => {
    let url = req.body.discussionLink;
    if (url.length == 0) {
        url = undefined;
    }

    const regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if (!regexp.test(url) || url.indexOf('osu.ppy.sh/community/forums') == -1) {
        return res.json({ error: 'Not a valid URL' });
    }

    if(!req.body.mode) req.body.mode = 'all';

    let rc = await rcDiscussionsService.create(
        req.body.discussionLink,
        req.body.title,
        req.body.shortReason,
        req.body.mode
    );
    res.json(rc);
    logsService.create(req.session.mongoId, `Submitted a RC proposal for voting`);
});

/* POST submit mediation */
router.post('/submitMediation/:id', async (req, res, next) => {
    let m;
    if(req.body.mediationId){
        m = await mediationsService.query({ _id: req.body.mediationId });
    }else{
        m = await mediationsService.create(req.session.mongoId);
        await rcDiscussionsService.update(req.params.id, { $push: { mediations: m } });
    }
    await mediationsService.update(m._id, { comment: req.body.comment, vote: req.body.vote });
    m = await rcDiscussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(m)
    logsService.create(
        req.session.mongoId,
        `Submitted vote for a RC proposal`
    );
});

/* POST submit mediation */
router.post('/concludeMediation/:id', async (req, res, next) => {
    await rcDiscussionsService.update(req.params.id, {isActive: false});
    let m = await rcDiscussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(m)
    logsService.create(
        req.session.mongoId,
        `Concluded vote for RC proposal`
    );
});


module.exports = router;
