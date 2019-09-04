const express = require('express');
const api = require('../helpers/api');
const helpers = require('../helpers/helpers');
const discussionsService = require('../models/discussion').service;
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
    res.render('discussionvote', {
        title: 'Discussion Vote',
        script: '../javascripts/discussionVote.js',
        isDiscussionVote: true,
        isBnOrNat: res.locals.userRequest.isBnOrNat,
        isNat: res.locals.userRequest.isNat,     
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let d;
    if(res.locals.userRequest.isNat){
        d = await discussionsService.query({}, defaultPopulate, { createdAt: -1 }, true);
    }else{
        d = await discussionsService.query({ isNatOnly: { $ne: true } }, defaultPopulate, { createdAt: -1 }, true);
    }
    res.json({ 
        discussions: d, 
        userId: req.session.mongoId,
        userModes: res.locals.userRequest.modes,
        isSpectator: res.locals.userRequest.isSpectator,
        isLeader: res.locals.userRequest.isLeader,
        isNat: res.locals.userRequest.isNat,
    });
});

/* POST create a new veto. */
router.post('/submit', async (req, res) => {
    let url = req.body.discussionLink;
    if (url.length == 0) {
        url = undefined;
    }
    
    if(req.body.discussionLink.length){
        const validUrl = helpers.isValidUrl(url, 'osu.ppy.sh');
        if (validUrl.error) return res.json({ error: validUrl.error });
    }

    let d = await discussionsService.create(
        req.body.discussionLink,
        req.body.title,
        req.body.shortReason,
        req.body.mode,
        req.body.isNatOnly
    );
    res.json(d);
    logsService.create(req.session.mongoId, 'Submitted a discussion for voting');
});

/* POST submit mediation */
router.post('/submitMediation/:id', async (req, res) => {
    let m;
    if(req.body.mediationId){
        m = await mediationsService.query({ _id: req.body.mediationId });
    }else{
        m = await mediationsService.create(req.session.mongoId);
        await discussionsService.update(req.params.id, { $push: { mediations: m } });
    }    
    await mediationsService.update(m._id, { comment: req.body.comment, vote: req.body.vote });
    m = await discussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(m);
    logsService.create(
        req.session.mongoId,
        'Submitted vote for a discussion'
    );
});

/* POST submit mediation */
router.post('/concludeMediation/:id', async (req, res) => {
    await discussionsService.update(req.params.id, { isActive: false });
    let m = await discussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(m);
    logsService.create(
        req.session.mongoId,
        'Concluded vote for a discussion'
    );
});


module.exports = router;
