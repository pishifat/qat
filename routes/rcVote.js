const express = require('express');
const api = require('../helpers/api');
const helpers = require('../helpers/helpers');
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
router.get('/', (req, res) => {
    res.render('rcvote', {
        title: 'Ranking Criteria Vote',
        script: '../javascripts/rcVote.js',
        isRcVote: true,
        isBnOrNat: res.locals.userRequest.isBnOrNat,
        isNat: res.locals.userRequest.isNat,     
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let rc = await rcDiscussionsService.query({}, defaultPopulate, { createdAt: -1 }, true);
    res.json({ 
        rcDiscussions: rc, 
        userId: req.session.mongoId,
        userModes: res.locals.userRequest.modes,
        isSpectator: res.locals.userRequest.isSpectator,
        isLeader: res.locals.userRequest.isLeader,
    });
});

/* POST create a new veto. */
router.post('/submit', async (req, res) => {
    let url = req.body.discussionLink;
    if (url.length == 0) {
        url = undefined;
    }

    const validUrl = helpers.isValidUrl(url, 'osu.ppy.sh/community/forums');
    if (validUrl.error) return res.json(validUrl.error);

    if(!req.body.mode) req.body.mode = 'all';

    let rc = await rcDiscussionsService.create(
        req.body.discussionLink,
        req.body.title,
        req.body.shortReason,
        req.body.mode
    );
    res.json(rc);
    logsService.create(req.session.mongoId, 'Submitted a RC proposal for voting');
});

/* POST submit mediation */
router.post('/submitMediation/:id', async (req, res) => {
    let m;
    if(req.body.mediationId){
        m = await mediationsService.query({ _id: req.body.mediationId });
    }else{
        m = await mediationsService.create(req.session.mongoId);
        await rcDiscussionsService.update(req.params.id, { $push: { mediations: m } });
    }
    await mediationsService.update(m._id, { comment: req.body.comment, vote: req.body.vote });
    m = await rcDiscussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(m);
    logsService.create(
        req.session.mongoId,
        'Submitted vote for a RC proposal'
    );
});

/* POST submit mediation */
router.post('/concludeMediation/:id', async (req, res) => {
    await rcDiscussionsService.update(req.params.id, { isActive: false });
    let m = await rcDiscussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(m);
    logsService.create(
        req.session.mongoId,
        'Concluded vote for RC proposal'
    );
});


module.exports = router;
