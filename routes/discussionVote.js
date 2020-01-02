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
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,     
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let d;
    if(res.locals.userRequest.isNat || res.locals.userRequest.isSpectator){
        d = await discussionsService.query({}, defaultPopulate, { createdAt: -1 }, true);
    }else{
        d = await discussionsService.query({ isNatOnly: { $ne: true } }, defaultPopulate, { createdAt: -1 }, true);
    }
    res.json({ 
        discussions: d, 
        userId: req.session.mongoId,
        userModes: res.locals.userRequest.modes,
        isLeader: res.locals.userRequest.isLeader,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

/* POST create a new discussion vote. */
router.post('/submit', api.isNat, async (req, res) => {
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
        req.session.mongoId,
        req.body.isNatOnly
    );
    res.json(d);
    logsService.create(req.session.mongoId, 'Submitted a discussion for voting');
    api.webhookPost(
        [{
            author: {
                name: `${req.session.username}`,
                icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                url: `https://osu.ppy.sh/users/${req.session.osuId}`,
            },
            color: '14805600',
            fields:[
                {
                    name: `http://bn.mappersguild.com/discussionvote?id=${d.id}`,
                    value: `**New discussion up for vote:** ${req.body.title}`,
                },
                {
                    name: `Proposal`,
                    value: req.body.shortReason,
                },
            ],
        }], 
        d.mode
    );
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
    let d = await discussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(d);
    logsService.create(
        req.session.mongoId,
        'Submitted vote for a discussion'
    );
    if(!req.body.mediationId){
        api.webhookPost(
            [{
                author: {
                    name: `${req.session.username}`,
                    icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                    url: `https://osu.ppy.sh/users/${req.session.osuId}`,
                },
                color: '16777024',
                fields:[
                    {
                        name: `http://bn.mappersguild.com/discussionvote?id=${d.id}`,
                        value: `Submitted vote for discussion on **${d.title}**`,
                    },
                ],
            }], 
            d.mode
        );
    }
});

/* POST conclude mediation */
router.post('/concludeMediation/:id', api.isLeader, async (req, res) => {
    await discussionsService.update(req.params.id, { isActive: false });
    let m = await discussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(m);
    logsService.create(
        req.session.mongoId,
        'Concluded vote for a discussion'
    );
});

/* POST save title */
router.post('/saveTitle/:id', api.isLeader, async (req, res) => {
    await discussionsService.update(req.params.id, { title: req.body.title });
    let d = await discussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(d);
    logsService.create(
        req.session.mongoId,
        `Changed discussion title to "${req.body.title}"`
    );
});

/* POST save shortReason */
router.post('/saveProposal/:id', api.isLeader, async (req, res) => {
    await discussionsService.update(req.params.id, { shortReason: req.body.shortReason });
    let d = await discussionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(d);
    logsService.create(
        req.session.mongoId,
        `Changed discussion proposal to "${req.body.shortReason}"`
    );
});


module.exports = router;
