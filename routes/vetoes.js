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
function getLimitedDefaultPopulate(mongoId) {
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

function getPopulate(isNat, mongoId) {
    if (isNat) return defaultPopulate;

    return getLimitedDefaultPopulate(mongoId);
}

/* GET vetoes list. */
router.get('/relevantInfo/:limit', async (req, res) => {
    let vetoes = await Veto
        .find({})
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        )
        .sort({ createdAt: -1 })
        .limit(parseInt(req.params.limit));

    res.json({
        vetoes,
    });
});

/* GET specific veto */
router.get('/searchVeto/:id', async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json(veto);
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
        vetoFormat: req.body.remediation == 'remediation' ? 4 : 3,
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
    const mediationData = req.body.mediation;
    const voteData = req.body.vote;
    const inputData = req.body.input;

    let isFirstComment = false;

    for (let i = 0; i < mediationData.mediationIds.length; i++) {
        const mediationId = mediationData.mediationIds[i];

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
        discord.webhookPost([{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightPurple,
            description: `Submitted opinion on [veto for **${veto.beatmapTitle}** (${count}/${veto.mediations.length})](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
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

/* POST select mediators */
router.post('/selectMediators', middlewares.isNat, async (req, res) => {
    const mode = req.body.mode;
    const vetoFormat = req.body.vetoFormat;
    const allUsers = vetoFormat == 4 ? await User.getAllBnAndNat() : await User.getAllMediators();

    if (allUsers.error) {
        return res.json({
            error: allUsers.error,
        });
    }

    let users = [];

    if (vetoFormat == 4 && mode == 'all') {
        for (const user of allUsers) {
            if (!req.body.excludeUsers.includes(user.username.toLowerCase())) {
                users.push(user);
            }
        }

        return res.json(users)
    } else if (vetoFormat == 4) {
        for (const user of allUsers) {
            if (!req.body.excludeUsers.includes(user.username.toLowerCase()) && user.modesInfo.some(m => m.mode === mode)) {
                users.push(user);
            }
        }

        return res.json(users);
    }

    let totalMediators;
    let validMediators;

    if (mode === 'all') {
        validMediators = await User.find({
            groups: { $in: ['nat', 'bn'] },
            isVetoMediator: true,
        });
    } else {
        validMediators = await User.find({
            groups: { $in: ['nat', 'bn'] },
            'modesInfo.mode': { $in: mode },
            isVetoMediator: true,
        });
    }

    totalMediators = vetoFormat == 4 ? validMediators.length : Math.round(validMediators.length * 0.2);
    if (totalMediators < 11) totalMediators = 11;

    for (let i = 0; i < allUsers.length; i++) {
        let user = allUsers[i];

        if (
            !req.body.excludeUsers.includes(user.username.toLowerCase()) &&
            (
                (user.modesInfo.some(m => m.mode === mode && (m.level == 'full' || m.level == 'evaluator')) && mode != 'all') ||
                (!user.modesInfo.some(m => m.level === 'probation') && mode == 'all')
            )
        ) {
            users.push(user);

            if (users.length >= totalMediators) {
                break;
            }
        }
    }

    res.json(users);
});

/* POST begin mediation */
router.post('/beginMediation/:id', middlewares.isNat, async (req, res) => {
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
    if (v.vetoFormat == 4) deadlineDays = 14;
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
router.post('/concludeMediation/:id', middlewares.isNat, async (req, res) => {
    let veto = await Veto
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
    
    const agreeMediations = veto.mediations.filter(mediation => mediation.vote == 1);
    const neutralMediations = veto.mediations.filter(mediation => mediation.vote == 2);
    const disagreeMediations = veto.mediations.filter(mediation => mediation.vote == 3);
    const submittedMediations = agreeMediations.length + neutralMediations.length + disagreeMediations.length;

    let description = `Concluded mediation on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`;
    description += '\n\n';
    description += `- **Agree:** ${agreeMediations.length} (${Math.round(agreeMediations.length / submittedMediations * 100) || '0'}%)\n`;
    neutralMediations.length ? description += `- **Partially Agree:** ${neutralMediations.length} (${Math.round(neutralMediations.length / submittedMediations * 100) || '0' }%)\n` : '';
    description += `- **Disagree:** ${disagreeMediations.length} (${Math.round(disagreeMediations.length / submittedMediations * 100)  || '0'}%)\n`;
    description += `- **Submitted votes:** ${submittedMediations} (${Math.round(submittedMediations / veto.mediations.length * 100) || '0'}%)\n`;
    description += `- **Assigned mediators:** ${veto.mediations.length}`;
    description += '\n\n';
    description += `Consensus: **${agreeMediations.length > disagreeMediations.length ? 'Upheld' : 'Dismissed'}**`;

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.purple,
        description,
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

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.purple,
        description: `**Resumed** mediation on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
    }],
        veto.mode);
});

/* POST replace mediator */
router.post('/replaceMediator/:id', middlewares.isNat, async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate);

    const mediationIds = [];

    let oldMediationUsername;
    let newMediationUsername;

    for (const mediation of veto.mediations) {
        if (mediation.mediator.id == req.body.userId) {
            mediationIds.push(mediation.id);
            oldMediationUsername = mediation.mediator.username;
        }
    }

    let currentMediators = veto.mediations.map(m => m.mediator.osuId);
    let newMediator;

    if (veto.mode === 'all') {
        newMediator = await User.aggregate([
            { $match: { osuId: { $nin: currentMediators }, isVetoMediator: true, groups: { $in: ['bn', 'nat'] } } },
            { $sample: { size: 1 } },
        ]);
    } else {
        newMediator = await User.aggregate([
            {
                $match: {
                    modesInfo: { $elemMatch: { mode: veto.mode, level: { $ne: 'probation' } } },
                    osuId: { $nin: currentMediators },
                    isVetoMediator: true,
                },
            },
            { $sample: { size: 1 } },
        ]);
    }

    for (let i = 0; i < mediationIds.length; i++) {
        const mediationId = mediationIds[i];
        const newMediation = await Mediation
            .findByIdAndUpdate(mediationId, { mediator: newMediator[0]._id })
            .populate({
                path: 'mediator',
                select: 'username',
            });

        newMediationUsername = newMediation.mediator.username;
    }

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
        description: `Replaced **${oldMediationUsername}** with **${newMediationUsername}** as mediator on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
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

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.black,
        description: `Deleted veto for **${veto.beatmapTitle}**`,
    }],
        veto.mode);
});

/* POST send messages */
router.post('/sendMessages/:id', middlewares.isNat, async (req, res) => {
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

module.exports = router;
