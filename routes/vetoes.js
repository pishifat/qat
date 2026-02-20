const express = require('express');
const Veto = require('../models/veto');
const User = require('../models/user');
const Mediation = require('../models/mediation');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const osu = require('../helpers/osu');
const osuBot = require('../helpers/osuBot');
const discord = require('../helpers/discord');

const router = express.Router();

// population for NAT
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
    {
        path: 'vouchingUsers',
        select: 'username osuId',
    },
    {
        path: 'chatroomUsers',
        select: 'username osuId',
    },
    {
        path: 'chatroomUsersPublic',
        select: 'username osuId',
    },
    {
        path: 'chatroomMediationRequestedUsers',
        select: 'username osuId',
    },
    {
        path: 'chatroomUpholdVoters',
        select: 'username osuId',
    },
    {
        path: 'chatroomDismissVoters',
        select: 'username osuId',
    },
    {
        path: 'publicMediations',
        select: 'vote reasonIndex',
    },
    {
        path: 'chatroomMessages.user',
        select: 'username osuId',
    },
];

// population for logged out users. hides mediator info
function getLoggedOutPopulate() {
    return {
        path: 'mediations',
        select: '-mediator',
    };
}

// population for logged in users who aren't NAT. hides names of mediators and vetoers aside from the user
function getLimitedDefaultPopulate(mongoId) {
    return [
        {
            path: 'vetoer',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'mediations',
            populate: {
                path: 'mediator',
                match: {
                    _id: mongoId,
                },
                select: 'username osuId',
            },
        },
        {
            path: 'vouchingUsers',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'chatroomUsers',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'chatroomUsersPublic',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'chatroomMediationRequestedUsers',
            select: 'id',
        },
        {
            path: 'chatroomUpholdVoters',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'chatroomDismissVoters',
            select: 'username osuId',
            match: {
                _id: mongoId,
            },
        },
        {
            path: 'publicMediations',
            populate: {
                path: 'mediator',
                match: {
                    _id: mongoId,
                },
                select: 'username osuId',
            },
        },
        {
            path: 'chatroomMessages.user',
            select: 'username osuId',
        },
    ];
}

function getPopulate(isNat, mongoId) {
    if (!mongoId) return getLoggedOutPopulate();
    if (!isNat) return getLimitedDefaultPopulate(mongoId);

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

    for (let i = 0; i < vetoes.length; i++) {
        if (!vetoes[i].chatroomUsers.length) vetoes[i].chatroomMessages = [];

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
            )
            .select('-vouchingUsers -chatroomUsers -chatroomUsersPublic -chatroomMessages -vetoer');
    } else {
        const user = await User.findById(req.session.mongoId);
        const isNat = user.isNat;

        veto = await Veto
            .findById(req.params.id)
            .populate(
                getPopulate(isNat, req.session.mongoId)
            );
    }

    if (!veto.chatroomUsers.length) veto.chatroomMessages = [];

    res.json(veto);
});

/* POST create a new veto. */
router.post('/submit', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const { mode, url, reasons } = req.body;

    // validation
    if (!reasons.length) {
        return res.json({ error: 'Veto must include reasons!' });
    }

    util.isValidUrlOrThrow(url);
    const beatmapsetId = util.getBeatmapsetIdFromUrl(url);
    const osuBeatmapset = await osu.getBeatmapsetInfo(req.session.accessToken, beatmapsetId);
    const eligibleStatuses = [-2, -1, 0, 3]; // see osu! api doc: https://osu.ppy.sh/docs/#beatmapset-rank-status

    if (!eligibleStatuses.includes(osuBeatmapset.ranked)) {
        return res.json({ error: `This map has a permanent leaderboard already!` });
    }

    if (!res.locals.userRequest.isBnOrNat) {
        return res.json({ error: 'Only BN and NAT members can submit vetoes!' });
    }

    // create veto
    let veto = await Veto.create({
        vetoer: req.session.mongoId,
        reasons,
        beatmapId: beatmapsetId,
        beatmapTitle: osuBeatmapset.artist + ' - ' + osuBeatmapset.title,
        beatmapMapper: osuBeatmapset.creator,
        beatmapMapperId: osuBeatmapset.user_id,
        mode,
        vetoFormat: 7,
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

    let description = `Anonymous user submitted [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`;

    for (let i = 0; i < veto.reasons.length; i++) {
        description += `\n- **Reason ${i + 1}:** ${veto.reasons[i].summary}`;
    }

    discord.webhookPost([{
        color: discord.webhookColors.darkPurple,
        description,
    }],
    'publicVetoes');
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

    if (!veto.chatroomUsers.length) veto.chatroomMessages = [];

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
                description += `\n\n**Reason ${i + 1}:**\n${veto.reasons[i].summary} (${submittedFilteredMediations.length}/${veto.mediations.length / veto.reasons.length})`;
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
router.post('/selectMediators/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const { mode, excludeUsers } = req.body;

    const [allUsers, veto] = await Promise.all([
        User.getAllBnAndNat(),
        Veto
            .findById(req.params.id)
            .populate(defaultPopulate)
            .orFail(),
    ]);

    if (allUsers.error) {
        return res.json({
            error: allUsers.error,
        });
    }

    excludeUsers.push(veto.vetoer.username);

    for (const user of veto.vouchingUsers) {
        excludeUsers.push(user.username);
    }

    let users = [];

    const shuffled = [...allUsers].sort(() => Math.random() - 0.5);

    for (const user of shuffled) {
        if (!excludeUsers.includes(user.username.toLowerCase())) {
            if (mode == 'all') {
                users.push(user);
            } else if (user.modesInfo.some(m => m.mode === mode)) {
                users.push(user);
            }
        }
    }

    const count = Math.ceil(users.length * 0.4);

    res.json(users.slice(0, count));
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
    'publicVetoes');
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
        `Veto mediation concluded for "${veto.beatmapTitle}"`,
        'veto',
        veto._id
    );

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.purple,
        description: `Concluded mediation on [veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`,
    }],
    'publicVetoes');
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
        .findByIdAndDelete(req.params.id)
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
    };

    const message = await osuBot.sendAnnouncement(osuIds, channel, req.body.message);

    if (message !== true) {
        return res.json({ error: message.error ? message.error : `Messages were not sent.` });
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

/* POST toggle vouch for a user on veto */
router.post('/toggleVouch/:id', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const userId = req.body.specificUserId || req.session.mongoId;

    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    if (veto.vetoer.id == userId) {
        return res.json({ error: 'You can\'t vouch for your own vetoes!' });
    }

    if (res.locals.userRequest.isNat && (userId == req.session.mongoId)) {
        return res.json({ error: 'NAT members cannot vouch!' });
    }

    if (veto.vouchingUsers.length >= 2) {
        return res.json({ error: 'This veto has already been vouched for by 2 BNs! It\'ll progress soon...' });
    }

    const vouchingUserIds = veto.vouchingUsers.map(u => u.id);
    const isVouching = !vouchingUserIds.includes(userId);
    let toggleWebhook = false;

    if (isVouching) {
        // add user to vouchingUsers
        veto.vouchingUsers.push(res.locals.userRequest._id);

        if (veto.vouchingUsers.length == 2) {
            toggleWebhook = true;
        }
    } else {
        // remove user from vouchingUsers
        let index = veto.vouchingUsers.findIndex(u => u.id == userId);
        veto.vouchingUsers.splice(index, 1);
    }

    await veto.save();

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({
        veto,
        success: 'Done!',
    });

    Logger.generate(
        req.session.mongoId,
        `${isVouching? 'Vouched' : 'Removed vouch'} for veto"`,
        'veto',
        veto._id
    );

    if (toggleWebhook) {
        const description = `**2 users** vouched for [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes?id=${veto.id})\n\nReview and initiate veto if necessary!`;

        discord.webhookPost([{
            color: discord.webhookColors.lightPurple,
            description,
        }],
        veto.mode);
    }
});

/* POST change veto to "chatroom" status */
router.post('/createChatroom/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    let chatroomUsersPublic = [];

    const includeUsersSplit = req.body.includeUsers.split(',');

    for (const userString of includeUsersSplit) {
        const username = userString.trim();

        if (username.length) {
            const user = await User.findByUsernameOrOsuId(username);

            if (!user) {
                return res.json({ error: `${username} is not in BNsite database. Ask them to log in.` });
            }

            chatroomUsersPublic.push(user._id);
        }
    }

    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const mapper = await User.findByUsernameOrOsuId(veto.beatmapMapperId);

    if (!mapper) {
        return res.json({ error: `${veto.beatmapMapper} is not in BNsite database. Ask them to log in.` });
    }

    chatroomUsersPublic.push(mapper._id);
    veto.chatroomUsersPublic = chatroomUsersPublic;
    veto.chatroomUsers = [veto.vetoer._id];
    veto.chatroomUsers = veto.chatroomUsers.concat(veto.vouchingUsers);
    veto.chatroomUsers = veto.chatroomUsers.concat(chatroomUsersPublic);
    veto.status = 'chatroom';
    veto.chatroomInitiated = new Date();
    veto.chatroomMessages.push({
        date: new Date(),
        content: `Welcome to the discussion forum for the pending veto on [**${veto.beatmapTitle}**](https://osu.ppy.sh/beatmapsets/${veto.beatmapId})! See the veto reasons above for context.\n\nUsers involved in this discussion:\n\n- Veto creator (anonymous)\n- BNs who vouched in support of the veto (anonymous)\n- Mapset host\n- Anyone else who the NAT thought was relevant\n\nThe veto's creator and vouching users are **anonymous**. If you're one of these users, you can reveal your identity with a button below.\n\nYour goal is to resolve the veto's concerns through discussion and/or changes to the map. Follow [osu!'s code of conduct](https://osu.ppy.sh/wiki/en/Rules/Code_of_conduct_for_modding_and_mapping) while doing this, and do not expose this discussion to outsiders! If a conclusion cannot be reached, you can allow the map to be mediated by a larger group of Beatmap Nominators. This option will become available 24h from this message!\n\nIf you have any questions or want to report something sketchy, talk to someone in the NAT. They can read and speak in this chatroom too.`,
        user: null,
        userIndex: 0,
        isSystem: true,
    });
    veto.chatroomMessages.push({
        date: new Date(),
        content: `To start the discussion, the mapper should explain their thoughts on the veto!`,
        user: null,
        userIndex: 0,
        isSystem: true,
    });

    await veto.save();

    // send messages
    await veto.populate([
        { path: 'chatroomUsers', select: 'username osuId' },
    ]);

    const osuIds = veto.chatroomUsers.map(user => user.osuId);

    const channel = {
        name: `Veto Discussion (${veto.mode == 'all' ? 'All game modes' : veto.mode == 'osu' ? 'osu!' : `osu!${veto.mode}`})`,
        description: `A pending veto you're involved with has opened discussion`,
    };
    const words = `Discussion for the pending veto on [**${veto.beatmapTitle}**](https://osu.ppy.sh/beatmapsets/${veto.beatmapId}) has begun!\n\nTry to reach a conclusion here: http://bn.mappersguild.com/vetoes?id=${veto.id}\n\nIf a conclusion cannot be reached, the veto may be mediated by a larger group of Beatmap Nominators.`;

    // sending each message in a separate announcement to preserve anonymity
    for (const user of veto.chatroomUsers) {
        const message = await osuBot.sendAnnouncement([user.osuId], channel, words);
        await util.sleep(500);

        if (message !== true) {
            return res.json({ error: message.error ? message.error : `Messages were not sent.` });
        }
    }

    // update frontend and log
    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({
        veto,
        success: 'Chatroom initiated! Sent announcement message to involved users!',
    });

    Logger.generate(
        req.session.mongoId,
        `Initiated chatroom for veto`,
        'veto',
        veto._id
    );

    const description = `Discussion initiated on [veto for **${veto.beatmapTitle}**](https://osu.ppy.sh/beatmapsets/${veto.beatmapId})`;

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.pink,
        description,
    }],
    'publicVetoes');
});

/* POST add message to veto chatroom */
router.post('/saveMessage/:id', middlewares.isLoggedIn, async (req, res) => {
    const message = req.body.message;

    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const publicUserIds = veto.chatroomUsersPublic.map(u => u.id);
    const isPublicUser = publicUserIds.includes(req.session.mongoId);
    const privateUserIds = veto.chatroomUsers.map(u => u.id);
    const userIndex = privateUserIds.findIndex(id => id == req.session.mongoId);

    veto.chatroomMessages.push({
        date: new Date(),
        content: message,
        user: isPublicUser || userIndex == -1 ? req.session.mongoId : null,
        userIndex: userIndex + 1,
        isModerator: userIndex == -1,
    });

    await veto.save();

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Sent message in veto discussion`,
        'veto',
        veto._id
    );
});

/* POST reveal username in veto chatroom */
router.post('/revealUsername/:id', middlewares.isLoggedIn, async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const privateUserIds = veto.chatroomUsers.map(u => u.id);
    const userIndex = privateUserIds.findIndex(id => id == req.session.mongoId);

    veto.chatroomUsersPublic.push(req.session.mongoId);
    veto.chatroomMessages.push({
        date: new Date(),
        content: `**Anonymous user ${userIndex + 1}** is actually [**${req.session.username}**](https://osu.ppy.sh/users/${req.session.osuId})! This will be shown in future messages.`,
        user: null,
        userIndex: 0,
        isSystem: true,
    });

    await veto.save();

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Revealed username in veto discussion`,
        'veto',
        veto._id
    );
});

/* POST request mediation */
router.post('/requestMediation/:id', middlewares.isLoggedIn, async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const chatroomMediationRequestedUserIds = veto.chatroomMediationRequestedUsers.map(u => u.id);

    if (!veto.chatroomMediationRequestedUsers.includes(req.session.mongoId)) {
        veto.chatroomMediationRequestedUsers.push(req.session.mongoId);
    }

    await veto.populate([
        { path: 'chatroomMediationRequestedUsers', select: 'username osuId' },
    ]);

    const chatroomMediationRequestedUserOsuIds = veto.chatroomMediationRequestedUsers.map(u => u.osuId);
    const mapperInitiated = chatroomMediationRequestedUserOsuIds.includes(veto.beatmapMapperId);
    const chatroomUsersPublicIds = veto.chatroomUsersPublic.map(u => u.id);
    const publicUserInitiated = chatroomUsersPublicIds.includes(req.session.mongoId);
    const mapperLink = `[**${veto.beatmapMapper}**](https://osu.ppy.sh/users/${veto.beatmapMapperId})`;
    const userLink = `[**${req.session.username}**](https://osu.ppy.sh/users/${req.session.osuId})`;

    if (veto.chatroomMediationRequestedUsers.length >= 2 || mapperInitiated) {
        veto.status = 'available';
        veto.chatroomMessages.push({
            date: new Date(),
            content: `${mapperInitiated ? mapperLink : publicUserInitiated ? userLink : 'A user'} requested mediation. The discussion has concluded.`,
            user: null,
            userIndex: 0,
            isSystem: true,
        });
    } else {
        veto.chatroomMessages.push({
            date: new Date(),
            content: `${publicUserInitiated ? userLink : 'A user'} requested mediation. If another user requests mediation, the discussion will conclude.`,
            user: null,
            userIndex: 0,
            isSystem: true,
        });
    }

    await veto.save();

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Requested mediation in veto discussion`,
        'veto',
        veto._id
    );

    const description = `Mediation requested on [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes?id=${veto.id}) (${veto.chatroomMediationRequestedUsers.length}/2)`;

    discord.webhookPost([{
        color: discord.webhookColors.lightPink,
        description,
    }],
    veto.mode);
});

/* GET refresh veto for chatroom purposes */
router.get('/refreshVeto/:id', middlewares.isLoggedIn, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({ veto });
});

/* POST delete message in veto chatroom */
router.post('/deleteMessage/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const messageId = req.body.messageId;

    const index = veto.chatroomMessages.findIndex(m => m.id == messageId);

    if (index > 0) {
        veto.chatroomMessages.splice(index, 1);
    } else {
        return res.json({ error: `Can't delete message.` });
    }

    await veto.save();

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Deleted message in veto discussion`,
        'veto',
        veto._id
    );
});

/* POST start vote in veto chatroom */
router.post('/startVote/:id', middlewares.isLoggedIn, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    if (req.session.osuId != veto.beatmapMapperId) {
        return res.json({ error: 'Only the mapper can start a vote!' });
    }

    veto.chatroomVoteEnabled = true;
    veto.chatroomUpholdVoters = [];
    veto.chatroomDismissVoters = [];
    veto.chatroomMessages.push({
        date: new Date(),
        content: `[**${veto.beatmapMapper}**](https://osu.ppy.sh/users/${veto.beatmapMapperId}) started a vote to dismiss the veto!\n\nEnsure everyone knows which version of the map to vote on, then follow the instructions below.`,
        user: null,
        userIndex: 0,
        isSystem: true,
    });
    await veto.save();

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Started vote for veto in discussion`,
        'veto',
        veto._id
    );
});

/* POST submit vote in veto chatroom */
router.post('/vote/:id', middlewares.isLoggedIn, async (req, res) => {
    const vote = req.body.vote;
    let veto = await Veto
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    if (!veto.chatroomVoteEnabled) {
        return res.json({ error: 'Vote not in progress!' });
    }

    const validVotingUserIds = veto.vouchingUsers.map(u => u.id);
    validVotingUserIds.push(veto.vetoer.id);

    if (!validVotingUserIds.includes(req.session.mongoId)) {
        return res.json({ error: 'Only the vetoer and the vouching users can vote!' });
    }

    const chatroomUsersPublicIds = veto.chatroomUsersPublic.map(u => u.id);
    const isPublicUser = chatroomUsersPublicIds.includes(req.session.mongoId);
    const privateUserIds = veto.chatroomUsers.map(u => u.id);
    const userIndex = privateUserIds.findIndex(id => id == req.session.mongoId);
    const userText = isPublicUser ? `[**${req.session.username}**](https://osu.ppy.sh/users/${req.session.osuId})` : `**Anonymous user ${userIndex + 1}**`;

    const chatroomUpholdVotersIds = veto.chatroomUpholdVoters.map(u => u.id);
    const chatroomDismissVotersIds = veto.chatroomDismissVoters.map(u => u.id);
    let revote = false;

    if (vote == 'uphold') {
        if (chatroomUpholdVotersIds.includes(req.session.mongoId)) {
            return res.json({ error: 'Already voted!' });
        }

        if (chatroomDismissVotersIds.includes(req.session.mongoId)) {
            const index = veto.chatroomDismissVoters.findIndex(u => u.id == req.session.mongoId);
            veto.chatroomDismissVoters.splice(index, 1);
            revote = true;
        }

        veto.chatroomUpholdVoters.push(req.session.mongoId);
    } else if (vote == 'dismiss') {
        if (chatroomDismissVotersIds.includes(req.session.mongoId)) {
            return res.json({ error: 'Already voted!' });
        }

        if (chatroomUpholdVotersIds.includes(req.session.mongoId)) {
            const index = veto.chatroomUpholdVoters.findIndex(u => u.id == req.session.mongoId);
            veto.chatroomUpholdVoters.splice(index, 1);
            revote = true;
        }

        veto.chatroomDismissVoters.push(req.session.mongoId);
    } else {
        return res.json({ error: 'Invalid vote' });
    }

    veto.chatroomMessages.push({
        date: new Date(),
        content: `${userText} ${revote ? 'changed their vote' : 'voted'} to ${vote}!`,
        user: null,
        userIndex: 0,
        isSystem: true,
    });

    if (veto.chatroomUpholdVoters.length >= 2) {
        veto.chatroomMessages.push({
            date: new Date(),
            content: `A majority was reached! The veto was **not dismissed**, so the discussion will continue.\n\nIf the mapper makes further changes, a new vote can start.\n\nIf a conclusion cannot be reached, mediation may be requested.`,
            user: null,
            userIndex: 0,
            isSystem: true,
        });
        veto.chatroomVoteEnabled = false;
    } else if (veto.chatroomDismissVoters.length >= 2) {
        veto.chatroomMessages.push({
            date: new Date(),
            content: `A majority was reached! The veto was **dismissed**, so the discussion has finished.\n\nThe NAT will review this discussion and archive the veto (if nothing broke). Thank you for participating!`,
            user: null,
            userIndex: 0,
            isSystem: true,
        });
        veto.chatroomVoteEnabled = false;
        veto.chatroomLocked = true;

        discord.webhookPost([{
            color: discord.webhookColors.purple,
            description: `[Veto for **${veto.beatmapTitle}**](https://bn.mappersguild.com/vetoes?id=${veto.id}) dismissed by vote. Check to make sure if everything worked, and move to archive if so.`,
        }],
        veto.mode);
    }

    await veto.save();

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        );

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Voted "${vote}" for veto in discussion`,
        'veto',
        veto._id
    );
});

/* POST set veto status as "available" */
router.post('/setStatusAvailable/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        ).orFail();

    veto.status = 'available';
    await veto.save();

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Set veto status to "available"`,
        'veto',
        veto._id
    );

    let description = `Concluded discussion on [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`;

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.darkPurple,
        description,
    }],
    'publicVetoes');
});

/* POST set veto status as "archive" */
router.post('/setStatusArchive/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        ).orFail();

    veto.status = 'archive';
    await veto.save();

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Set veto status to "archive"`,
        'veto',
        veto._id
    );

    let description = `Archived [veto for **${veto.beatmapTitle}** by **${veto.beatmapMapper}**](https://bn.mappersguild.com/vetoes?id=${veto.id})`;

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(req.session),
        color: discord.webhookColors.gray,
        description,
    }],
    'publicVetoes');
});

/* POST submit public mediation */
router.post('/submitPublicMediation/:id', middlewares.isLoggedIn, async (req, res) => {
    const voteData = req.body.vote;
    let veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(false, req.session.mongoId)
        ).orFail();

    for (let index = 0; index < veto.reasons.length; index++) {
        let mediation = veto.publicMediations.find(m => m.mediator.id == req.session.mongoId && m.reasonIndex == index);
        const vote = voteData.votes[index];

        if (!mediation && vote) {
            mediation = new Mediation();
            mediation.mediator = req.session.mongoId;
            mediation.vote = voteData.votes[index];
            mediation.reasonIndex = index;
            await mediation.save();
            veto.publicMediations.push(mediation);
            await veto.save();
        } else if (mediation && vote) {
            mediation.vote = vote;
            await mediation.save();
        }
    }

    veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        ).orFail();

    if (!veto.chatroomUsers.length) veto.chatroomMessages = [];

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Submitted community veto mediation`,
        'veto',
        veto._id
    );
});

/* POST set veto reason status */
router.post('/setVetoReasonStatus/:id', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const { status, reasonIndex } = req.body;

    const veto = await Veto
        .findById(req.params.id)
        .populate(
            getPopulate(res.locals.userRequest.isNat, req.session.mongoId)
        ).orFail();
    await veto.save();

    veto.reasons[reasonIndex].status = status;
    await veto.save();

    res.json({ veto });

    Logger.generate(
        req.session.mongoId,
        `Set veto reason status as "${status}"`,
        'veto',
        veto._id
    );
});

module.exports = router;
