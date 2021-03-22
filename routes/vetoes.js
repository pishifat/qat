const express = require('express');
const Veto = require('../models/veto');
const User = require('../models/user');
const Mediation = require('../models/mediation');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const osuv1 = require('../helpers/osuv1');
const discord = require('../helpers/discord');

const router = express.Router();

router.use(middlewares.isLoggedIn);

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

// hides mediator info
function getLimitedDefaultPopulate (mongoId) {
    return {
        path: 'mediations',
        populate: {
            path: 'mediator',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
    };
}

function getPopulate (isNat, mongoId) {
    if (isNat) return defaultPopulate;

    return getLimitedDefaultPopulate(mongoId);
}

/* GET vetoes list. */
router.get('/relevantInfo', async (req, res) => {
    let vetoes = await Veto
        .find({})
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        )
        .sort({ createdAt: -1 });

    res.json({
        vetoes,
    });
});

/* POST create a new veto. */
router.post('/submit', async (req, res) => {
    if (!req.body.reasons.length) {
        return res.json({ error: 'Veto must include reasons!' });
    }

    const bmId = util.getBeatmapsetIdFromUrl(req.body.reasons[0].link);

    let containChecks = ['osu.ppy.sh/beatmapsets', 'discussion'];
    containChecks.push(bmId);

    for (let i = 0; i < containChecks.length; i++) {
        const contain = containChecks[i];

        for (let j = 0; j < req.body.reasons.length; j++) {
            const reason = req.body.reasons[j];
            util.isValidUrlOrThrow(reason.link, contain);
        }

    }

    const bmInfo = await osuv1.beatmapsetInfo(bmId);

    if (!bmInfo || bmInfo.error) {
        return res.json(bmInfo);
    }

    if (!res.locals.userRequest.isBnOrNat && req.session.osuId != bmInfo.creator_id) {
        return res.json({ error: 'You can only submit vetoes for mediation on your own beatmaps!' });
    }

    let veto = await Veto.create({
        vetoer: req.session.mongoId,
        reasons: req.body.reasons,
        beatmapId: bmInfo.beatmapset_id,
        beatmapTitle: bmInfo.artist + ' - ' + bmInfo.title,
        beatmapMapper: bmInfo.creator,
        beatmapMapperId: bmInfo.creator_id,
        mode: req.body.mode,
    });
    veto = await Veto
        .findById(veto._id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({
        veto,
        success: 'Submitted veto',
    });

    Logger.generate(
        req.session.mongoId,
        `Submitted a veto for mediation on "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );
    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.darkPurple,
        description: `Submitted [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
    }],
    req.body.mode);
});

/* POST submit mediation */
router.post('/submitMediation/:id', middlewares.isBnOrNat, async (req, res) => {
    const mediation = await Mediation
        .findOne({
            _id: req.body.mediationId,
            mediator: req.session.mongoId,
        })
        .orFail();
    const isFirstComment = mediation.comment === undefined;

    mediation.comment = req.body.comment;
    mediation.vote = req.body.vote;
    await mediation.save();

    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({
        veto,
        success: 'Submitted mediation',
    });

    Logger.generate(
        req.session.mongoId,
        `${isFirstComment ? 'Submitted' : 'Updated'} vote for a veto`,
        'veto',
        veto._id
    );

    let count = 0;
    veto.mediations.forEach(mediation => {
        if (mediation.comment) count++;
    });

    if (isFirstComment) {
        discord.webhookPost([{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightPurple,
            description: `Submitted opinion on [veto for **${veto.beatmapTitle}** (${count}/${veto.mediations.length})](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
        }],
        veto.mode);
    }
});

/* POST set status upheld or withdrawn. */
router.post('/selectMediators', middlewares.isNat, async (req, res) => {
    let allUsers = await User.getAllMediators();

    if (allUsers.error) {
        return res.json({
            error: allUsers.error,
        });
    }

    let usernames = [];

    for (let i = 0; i < allUsers.length; i++) {
        let user = allUsers[i];

        if (
            !req.body.excludeUsers.includes(user.username.toLowerCase()) &&
            (
                (user.modesInfo.some(m => m.mode === req.body.mode && m.level === 'full') && req.body.mode != 'all') ||
                (!user.modesInfo.some(m => m.level === 'probation') && req.body.mode == 'all')
            )
        ) {
            usernames.push(user);

            if (usernames.length >= (req.body.mode == 'osu' || req.body.mode == 'all' ? 11 : 7)) {
                break;
            }
        }
    }

    res.json(usernames);
});

/* POST begin mediation */
router.post('/beginMediation/:id', middlewares.isNat, async (req, res) => {
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
        `Started veto mediation for "${v.beatmapTitle}"`,
        'veto',
        v._id
    );
    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.purple,
        description: `Started mediation on [veto for **${v.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${v.id})`,
    }],
    v.mode);
});

/* POST conclude mediation */
router.post('/concludeMediation/:id', middlewares.isNat, async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate);

    if (req.body.dismiss || !req.body.majorityUphold) {
        veto.status = 'withdrawn';
    } else {
        veto.status = 'upheld';
    }

    await veto.save();
    res.json(veto);
    Logger.generate(
        req.session.mongoId,
        `Veto ${veto.status.charAt(0).toUpperCase() + veto.status.slice(1)} for "${veto.beatmapTitle}" ${req.body.dismiss ? 'without mediation' : ''}`,
        'veto',
        veto._id
    );
    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.purple,
        description: `Concluded mediation on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
    }],
    veto.mode);
});

/* POST continue mediation */
router.post('/continueMediation/:id', middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findByIdAndUpdate(req.params.id, { status: 'wip' })
        .populate(defaultPopulate);

    res.json(veto);
    Logger.generate(
        req.session.mongoId,
        `Veto mediation for "${veto.beatmapTitle}" re-initiated`,
        'veto',
        veto._id
    );
});

/* POST replace mediator */
router.post('/replaceMediator/:id', middlewares.isNat, async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate);

    let currentMediators = veto.mediations.map(m => m.mediator.osuId);
    let newMediator;

    if (veto.mode === 'all') {
        newMediator = await User.aggregate([
            { $match: { osuId: { $nin: currentMediators }, isVetoMediator: true } },
            { $sample: { size: 1 } },
        ]);
    } else {
        newMediator = await User.aggregate([
            {
                $match: {
                    modesInfo: { $elemMatch: { mode: veto.mode, level: 'full' } },
                    osuId: { $nin: currentMediators },
                    isVetoMediator: true,
                },
            },
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

    res.json({
        veto,
        success: 'Replaced mediator',
    });

    Logger.generate(
        req.session.mongoId,
        'Re-selected a single veto mediator',
        'veto',
        veto._id
    );

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.darkOrange,
        description: `Replaced **${oldMediation.mediator.username}** with **${newMediation.mediator.username}** as mediator on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
    }],
    veto.mode);
});

/* POST delete veto */
router.post('/deleteVeto/:id', middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findByIdAndRemove(req.params.id)
        .orFail();

    res.json({ success: 'Deleted' });

    Logger.generate(
        req.session.mongoId,
        `Deleted veto for "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );

    console.log(veto.mode);

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.black,
        description: `Deleted veto for **${veto.beatmapTitle}**`,
    }],
    veto.mode);
});

module.exports = router;
