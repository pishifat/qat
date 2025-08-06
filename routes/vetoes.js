const express = require('express');
const Veto = require('../models/veto');
const User = require('../models/user');
const Mediation = require('../models/mediation');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const osuv1 = require('../helpers/osuv1');
const osuBot = require('../helpers/osuBot');
const discord = require('../helpers/discord');

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

// hides mediator info
function getLoggedOutPopulate() {
    return {
        path: 'mediations',
        select: '-mediator',
    };
}

function getLimitedDefaultPopulate(mongoId) {
    return {
        path: 'mediations',
        populate: {
            path: 'mediator',
            match: {
                _id: mongoId,
            },
            select: 'username osuId',
        },
    };
}

function getPopulate(isNat, mongoId) {
    if (!mongoId) return getLoggedOutPopulate();
    if (!isNat) return getLimitedDefaultPopulate(mongoId)
    
    return defaultPopulate;
}

/* GET vetoes list. */
router.get('/relevantInfo/:limit', async (req, res) => {
    let vetoes;

    if (!req.session.mongoId) {
        vetoes = await Veto
            .find({})
            .populate(
                getPopulate(false, null)
            )
            .sort({ createdAt: -1 })
            .limit(parseInt(req.params.limit));
    } else {
        const user = await User.findById(req.session.mongoId);
        const isNat = user.isNat;

        vetoes = await Veto
            .find({})
            .populate(
                getPopulate(isNat, req.session.mongoId)
            )
            .sort({ createdAt: -1 })
            .limit(parseInt(req.params.limit));
    }

    res.json({
        vetoes,
    });
});

/* GET specific veto */
router.get('/searchVeto/:id', async (req, res) => {
    let veto;

    if (!req.session.mongoId) {
        veto = await Veto
            .findById(req.params.id)
            .populate(
                getPopulate(false, null)
            );
    } else {
        const user = await User.findById(req.session.mongoId);
        const isNat = user.isNat;

        veto = await Veto
            .findById(req.params.id)
            .populate(
                getPopulate(isNat, req.session.mongoId)
            );
    }

    res.json(veto);
});

/* POST create a new veto. */
router.post('/submit', middlewares.isLoggedIn, async (req, res) => {
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
        vetoFormat: 6,
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

    let description = `Submitted [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`;

    for (let i = 0; i < veto.reasons.length; i++) {
        description += `\n- **Reason ${i + 1}:** ${veto.reasons[i].summary}`;
    }

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.darkPurple,
        description,
    }],
        req.body.mode);
});

/* POST submit mediation */
router.post('/submitMediation/:id', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const mediationData = req.body.mediation;
    const voteData = req.body.vote;
    const inputData = req.body.input;

    let isFirstComment = false;

    for (let i = 0; i < mediationData.mediationIds.length; i++) {
        const mediationId = mediationData.mediationIds[i];

        if (!inputData.comments[i]) {
            return res.json({ error: 'Mediation comments cannot be empty!' });
        }

        const mediation = await Mediation
            .findOne({
                _id: mediationId,
                mediator: req.session.mongoId,
            })
            .orFail();

        if (!mediation.comment && inputData.comments[i]) {
            isFirstComment = true;
        }

        mediation.comment = inputData.comments[i];
        mediation.vote = voteData.votes[i];
        await mediation.save();
    }

    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    // webhook
    let count = 0;

    for (const mediation of veto.mediations) {
        if (mediation.comment) count++;
    }

    if (isFirstComment) {
        let description = `Submitted opinion on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`;

        if (veto.reasons.length > 1) {
            for (let i = 0; i < veto.reasons.length; i++) {
                const submittedFilteredMediations = veto.mediations.filter(mediation => mediation.vote && mediation.reasonIndex == i);
                description += `\n- **Reason ${i + 1}:** ${veto.reasons[i].summary} (${submittedFilteredMediations.length}/${veto.mediations.length / veto.reasons.length})`;
            }
        } else {
            description += ` (${count}/${veto.mediations.length})`;
        }

        discord.webhookPost([{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightPurple,
            description,
        }],
            veto.mode);
    }

    // return
    res.json({
        veto,
        success: 'Submitted mediation',
    });

    // log
    Logger.generate(
        req.session.mongoId,
        `Submitted vote for a veto`,
        'veto',
        veto._id
    );
});

/* POST reset mediation comment */
router.post('/resetMediation/:id', middlewares.isLoggedIn, middlewares.isAdmin, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    const mediation = veto.mediations.find(mediation => mediation._id == req.body.mediationId);

    mediation.comment = undefined;
    mediation.vote = undefined;

    await mediation.save();

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.black,
        description: `Reset mediation vote and comment by **${mediation.mediator.username}** for [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
    }],
        veto.mode
    );

    res.json(veto);

    Logger.generate(
        req.session.mongoId,
        `Deleted mediation comment by ${mediation.mediator.username} for "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );
});

/* POST select mediators */
router.post('/selectMediators', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const mode = req.body.mode;
    const allUsers = await User.getAllBnAndNat();

    if (allUsers.error) {
        return res.json({
            error: allUsers.error,
        });
    }

    let users = [];

    for (const user of allUsers) {
        if (!req.body.excludeUsers.includes(user.username.toLowerCase())) {
            if (mode == 'all') {
                users.push(user);
            } else if (user.modesInfo.some(m => m.mode === mode)) {
                users.push(user);
            }
        }
    }

    res.json(users);
});

/* POST begin mediation */
router.post('/beginMediation/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const vetoReasons = req.body.reasons;
    const mediatorIds = req.body.mediatorIds;
    let v;

    for (let i = 0; i < mediatorIds.length; i++) {
        let mediatorId = mediatorIds[i];

        for (let j = 0; j < vetoReasons.length; j++) {
            let m = await Mediation.create({ mediator: mediatorId, reasonIndex: j });
            v = await Veto.findByIdAndUpdate(req.params.id, {
                $push: { mediations: m },
                status: 'wip',
            });
        }
    }

    let date = new Date();
    let deadlineDays = 7;
    date.setDate(date.getDate() + deadlineDays);
    v = await Veto
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
router.post('/concludeMediation/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate);

    veto.status = 'archive';

    await veto.save();

    res.json(veto);

    Logger.generate(
        req.session.mongoId,
        `Veto concluded for "${veto.beatmapTitle}"`,
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
router.post('/continueMediation/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
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

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.purple,
        description: `**Resumed** mediation on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
    }],
        veto.mode);
});

/* POST delete veto */
router.post('/deleteVeto/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
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

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.black,
        description: `Deleted veto for **${veto.beatmapTitle}**`,
    }],
        veto.mode);
});

/* POST send messages */
router.post('/sendMessages/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .orFail();

    req.body.users.push({ osuId: req.session.osuId });

    const osuIds = req.body.users.map(user => user.osuId);

    const channel = {
        name: `Veto Mediation (${veto.mode == 'all' ? 'All game modes' : veto.mode == 'osu' ? 'osu!' : `osu!${veto.mode}`})`,
        description: 'Request to participate in a veto mediation',
    }

    const message = await osuBot.sendAnnouncement(osuIds, channel, req.body.message);

    if (message !== true) {
        return res.json({ error: `Messages were not sent. Please let pishifat know!` });
    }

    res.json({ success: 'Messages sent! A copy was sent to you for confirmation' });

    Logger.generate(
        req.session.mongoId,
        `Sent chat messages to mediators of "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.white,
        description: `Sent chat messages to mediators of [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
    }],
        veto.mode);
});

// TODO delete this route when we're done using it
/* POST migrate mediations */
router.post('/migrateMediations', middlewares.isLoggedIn, middlewares.isAdmin, async (req, res) => {
    const oldVetoId = req.body.oldVetoId;
    const newVetoId = req.body.newVetoId;

    const [oldVeto, newVeto] = await Promise.all([
        Veto.findById(oldVetoId).populate(defaultPopulate).orFail(),
        Veto.findById(newVetoId).populate(defaultPopulate).orFail(),
    ]);

    if (oldVeto.beatmapId != newVeto.beatmapId) {
        return res.json({ error: 'Beatmap IDs do not match!' });
    }

    let migrationCount = 0;

    for (const newMediation of newVeto.mediations) {
        for (const oldMediation of oldVeto.mediations) {
            if (newMediation.reasonIndex == oldMediation.reasonIndex && newMediation.mediator.osuId == oldMediation.mediator.osuId) {
                newMediation.comment = oldMediation.comment;
                newMediation.vote = oldMediation.vote;
                try {
                    await newMediation.save();
                    migrationCount++;
                } catch (error) {
                    console.log(error);
                }
            }
        }
    }

    res.json({ success: `Migrated ${migrationCount} mediations!` });
});

module.exports = router;
