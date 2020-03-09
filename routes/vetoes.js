const express = require('express');
const api = require('../helpers/api');
const helpers = require('../helpers/helpers');
const Veto = require('../models/veto');
const User = require('../models/user');
const Mediation = require('../models/mediation');
const Logger = require('../models/log');

const router = express.Router();

const defaultPopulate = [
    {
        path: 'vetoer',
        select: 'username osuId',
    },
    {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId',
        },
    },
];

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('vetoes', {
        title: 'Vetoes',
        script: '../javascripts/vetoes.js',
        isVetoes: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let vetoes = await Veto
        .find({})
        .populate(defaultPopulate)
        .sort({ createdAt: -1 });

    res.json({
        vetoes,
        userId: req.session.mongoId,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        userOsuId: req.session.osuId,
    });
});

/* POST create a new veto. */
router.post('/submit', api.isNotSpectator, async (req, res) => {
    let url = req.body.discussionLink;

    if (url.length == 0) {
        url = undefined;
    }

    const validUrl = helpers.isValidUrl(url, 'osu.ppy.sh/beatmapsets');
    if (validUrl.error) return res.json(validUrl.error);

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

    let v = await Veto.create({
        vetoer: req.session.mongoId,
        discussionLink: req.body.discussionLink,
        beatmapId: bmInfo.beatmapset_id,
        beatmapTitle: bmInfo.artist + ' - ' + bmInfo.title,
        beatmapMapper: bmInfo.creator,
        beatmapMapperId: bmInfo.creator_id,
        shortReason: req.body.shortReason,
        mode: req.body.mode,
    });
    v = await Veto
        .findById(v._id)
        .populate(defaultPopulate);

    res.json(v);
    Logger.generate(req.session.mongoId, `Submitted a veto for mediation on "${v.beatmapTitle}"`);
    api.webhookPost([{
        author: {
            name: `${req.session.username}`,
            icon_url: `https://a.ppy.sh/${req.session.osuId}`,
            url: `https://osu.ppy.sh/users/${req.session.osuId}`,
        },
        color: '16731997',
        fields: [
            {
                name: `https://bn.mappersguild.com/vetoes?beatmap=${v.id}`,
                value: `Submitted veto on **${v.beatmapTitle}** by **${v.beatmapMapper}**`,
            },
        ],
    }],
    req.body.mode);
});

/* POST set status upheld or withdrawn. */
router.post('/selectMediators', api.isNat, api.isNotSpectator, async (req, res) => {
    let allUsers;

    try {
        allUsers = await User.getAllMediators();
    } catch (error) {
        return { error: error._message };
    }

    let usernames = [];

    for (let i = 0; i < allUsers.length; i++) {
        let user = allUsers[i];

        if (
            (user.modes.indexOf(req.body.mode) >= 0 || req.body.mode == 'all') &&
            !user.probation.length &&
            req.body.excludeUsers.indexOf(user.username.toLowerCase()) < 0
        ) {
            usernames.push(user);

            if (usernames.length >= (req.body.mode == 'osu' || req.body.mode == 'all' ? 11 : 5)) {
                break;
            }
        }
    }

    res.json(usernames);
});

/* POST begin mediation */
router.post('/beginMediation/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    for (let i = 0; i < req.body.mediators.length; i++) {
        let mediator = req.body.mediators[i];
        let m = await Mediation.create({ mediator: mediator._id });
        await Veto.findByIdAndUpdate(req.params.id, {
            $push: { mediations: m },
            status: 'wip',
        });
    }

    let date = new Date();
    date.setDate(date.getDate() + 7);
    const v = await Veto
        .findByIdAndUpdate(req.params.id, { deadline: date })
        .populate(defaultPopulate);

    res.json(v);
    Logger.generate(
        req.session.mongoId,
        `Started veto mediation for "${v.beatmapTitle}"`
    );
    api.webhookPost([{
        author: {
            name: `${req.session.username}`,
            icon_url: `https://a.ppy.sh/${req.session.osuId}`,
            url: `https://osu.ppy.sh/users/${req.session.osuId}`,
        },
        color: '12858015',
        fields: [
            {
                name: `https://bn.mappersguild.com/vetoes?beatmap=${v.id}`,
                value: `Started veto mediation on **${v.beatmapTitle}** by **${v.beatmapMapper}**`,
            },
        ],
    }],
    v.mode);
});

/* POST submit mediation */
router.post('/submitMediation/:id', api.isNotSpectator, async (req, res) => {
    const originalMediation = await Mediation.findById(req.body.mediationId);
    await Mediation.findByIdAndUpdate(req.body.mediationId, { comment: req.body.comment, vote: req.body.vote });
    const v = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(v);

    Logger.generate(
        req.session.mongoId,
        'Submitted vote for a veto'
    );

    if (!originalMediation.comment.length) {
        api.webhookPost([{
            author: {
                name: `${req.session.username}`,
                icon_url: `https://a.ppy.sh/${req.session.osuId}`,
                url: `https://osu.ppy.sh/users/${req.session.osuId}`,
            },
            color: '10895161',
            fields: [
                {
                    name: `https://bn.mappersguild.com/vetoes?beatmap=${v.id}`,
                    value: `Submitted opinion on veto for **${v.beatmapTitle}** by **${v.beatmapMapper}**`,
                },
            ],
        }],
        v.mode);
    }
});

/* POST conclude mediation */
router.post('/concludeMediation/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate);

    if (req.body.dismiss || !req.body.majority) {
        veto.status = 'withdrawn';
    } else {
        veto.status = 'upheld';
    }

    await veto.save();
    res.json(veto);
    Logger.generate(
        req.session.mongoId,
        `Veto ${veto.status.charAt(0).toUpperCase() + veto.status.slice(1)} for "${veto.beatmapTitle}" ${req.body.dismiss ? 'without mediation' : ''}`
    );
    api.webhookPost([{
        author: {
            name: `${req.session.username}`,
            icon_url: `https://a.ppy.sh/${req.session.osuId}`,
            url: `https://osu.ppy.sh/users/${req.session.osuId}`,
        },
        color: '5118500',
        fields: [
            {
                name: `https://bn.mappersguild.com/vetoes?beatmap=${veto.id}`,
                value: `Concluded veto mediation for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**`,
            },
        ],
    }],
    veto.mode);
});

/* POST continue mediation */
router.post('/continueMediation/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    const veto = await Veto
        .findByIdAndUpdate(req.params.id, { status: 'wip' })
        .populate(defaultPopulate);

    res.json(veto);
    Logger.generate(
        req.session.mongoId,
        `Veto mediation for "${veto.beatmapTitle}" re-initiated`
    );
});

/* POST replace mediator */
router.post('/replaceMediator/:id', api.isNat, api.isNotSpectator, async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate);

    let currentMediators = [];

    veto.mediations.forEach(mediation => {
        currentMediators.push(mediation.mediator.osuId);
    });

    let newMediator;

    if (veto.mode === 'all') {
        newMediator = await User.aggregate([
            { $match: { osuId: { $nin: currentMediators }, vetoMediator: true } },
            { $sample: { size: 1 } },
        ]);
    } else {
        newMediator = await User.aggregate([
            { $match: { modes: veto.mode, osuId: { $nin: currentMediators }, probation: { $ne: veto.mode }, vetoMediator: true } },
            { $sample: { size: 1 } },
        ]);
    }

    const oldMediation = await Mediation
        .findById(req.body.mediationId)
        .populate({
            path: 'mediator',
            select: 'username',
        });

    const newMediation = await Mediation
        .findByIdAndUpdate(req.body.mediationId, { mediator: newMediator[0]._id })
        .populate({
            path: 'mediator',
            select: 'username',
        });

    veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate);

    res.json(veto);

    Logger.generate(
        req.session.mongoId,
        'Re-selected a single veto mediator'
    );

    api.webhookPost([{
        author: {
            name: `${req.session.username}`,
            icon_url: `https://a.ppy.sh/${req.session.osuId}`,
            url: `https://osu.ppy.sh/users/${req.session.osuId}`,
        },
        color: '7347001',
        fields: [
            {
                name: `https://bn.mappersguild.com/vetoes?beatmap=${veto.id}`,
                value: `Replaced **${oldMediation.mediator.username}** with **${newMediation.mediator.username}** as mediator for veto on **${veto.beatmapTitle}** by **${veto.beatmapMapper}**`,
            },
        ],
    }],
    veto.mode);
});

module.exports = router;
