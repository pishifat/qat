const express = require('express');
const api = require('../models/api.js');
const vetoes = require('../models/veto.js');
const users = require('../models/user');

const router = express.Router();

const defaultPopulate = [
    { populate: 'mediator', display: 'username osuId', model: users.User },
    { populate: 'debaters', display: 'username osuId', model: users.User },
];

router.use(api.isLoggedIn);
router.use(api.isBnOrQat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('vetoes', {
        title: 'vetoes',
        script: '../javascripts/vetoes.js',
        isVetoes: true,
        layout: 'qatlayout',
        isBnOrQat: true,
        isQat: res.locals.userRequest.group == 'qat'
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    let v = await vetoes.service.query({}, defaultPopulate, { createdAt: 1 }, true);
    res.json({ vetoes: v, userId: req.session.qatMongoId, userGroup: req.session.qatGroup, isMediator: res.locals.userRequest.vetoMediator });
});

/* POST create a new veto. */
router.post('/submit', async (req, res, next) => {
    let url = req.body.beatmapLink;
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

    const v = await vetoes.service.create(
        req.session.qatMongoId,
        req.body.beatmapLink,
        bmInfo.beatmapset_id,
        bmInfo.title + ' - ' + bmInfo.artist,
        bmInfo.creator,
        req.body.reasonLink,
        req.body.mode
    );
    res.json(v);
});

/* POST mediate a veto. */
router.post('/mediate', async (req, res, next) => {
    const v = await vetoes.service.update(req.body.veto._id, {
        mediator: req.session.qatMongoId,
        status: 'wip',
    });
    res.json(v);
});

/* POST set status upheld or withdrawn. */
router.post('/setStatus', async (req, res, next) => {
    const v = await vetoes.service.update(req.body.veto._id, {
        status: req.body.status,
    });
    res.json(v);
});

module.exports = router;
