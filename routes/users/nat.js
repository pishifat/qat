const express = require('express');
const User = require('../../models/user');
const Logger = require('../../models/log');
const Note = require('../../models/note');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const util = require('../../helpers/util');
const scrap = require('../../helpers/scrap');
const osu = require('../../helpers/osu');
const config = require('../../config.json');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNat);

const defaultNotePopulate = [
    { path: 'author', select: 'username osuId' },
    { path: 'user', select: 'username osuId' },
];

const defaultNatEvaluationPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'selfSummary', populate: defaultNotePopulate },
];

/* GET user notes */
router.get('/loadUserNotes/:id', async (req, res) => {
    const notes = await Note
        .find({
            user: req.params.id,
            isHidden: { $ne: true },
        })
        .populate(defaultNotePopulate)
        .sort({ createdAt: -1 });

    res.json(notes);
});

/* POST save note */
router.post('/saveNote/:id', async (req, res) => {
    const { isWarning, isSummary, comment, noteId, evaluationId } = req.body;
    let warning;
    let note;

    // edit warning note if one exists
    if (isWarning) {
        warning = await Note.findOne({ user: req.params.id, isWarning: true });

        if (warning) {
            note = await Note.findByIdAndUpdate(warning.id, {
                author: req.session.mongoId,
                comment,
            });
        }
    }

    // create new note (or new warning if none exists)
    if (!warning && !noteId) {
        note = await Note.create({
            author: req.session.mongoId,
            user: req.params.id,
            comment,
            isWarning,
            isSummary,
        });
    }

    // NAT evaluation self-summary notes
    if (isSummary && noteId) {
        note = await Note.findByIdAndUpdate(noteId, {
            comment,
        });
    }

    // save note to NAT self-summary eval thing
    if (evaluationId) {
        const natLeaders = await User.find({ isNatLeader: true });
        
        await BnEvaluation.findByIdAndUpdate(evaluationId, {
            selfSummary: note._id,
            discussion: true,
            natEvaluators: natLeaders.map(u => u._id),
        });
    }

    // populate for return
    note = await Note
        .findById(note._id)
        .populate(defaultNotePopulate);

    res.json({
        note,
        success: 'Added note',
    });

    let u = await User.findById(req.params.id);

    Logger.generate(
        req.session.mongoId,
        `Added ${isWarning ? 'warning note' : isSummary ? 'summary note' : 'note'} to "${u.username}"'s profile`,
        'user',
        u._id
    );

    if (!isSummary) discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.brown,
            description: `Added ${isWarning ? '**warning** note' : 'note'} to [**${note.user.username}**'s profile](http://bn.mappersguild.com/users?id=${note.user.id})`,
            fields: [
                {
                    name: 'Note',
                    value: comment.length > 950 ? comment.slice(0, 950) + '... *(truncated)*' : comment,
                },
            ],
        }],
        u.modes && u.modes.length ? u.modes[0] : u.history && u.history.length ? u.history[0].mode : 'all' // priority: current mode > past mode > default to all
    );

    if (evaluationId) {
        const natLeaders = await User.find({ isNatLeader: true });
        const discordIds = natLeaders.map(u => u.discordId);
        const user = await User.findById(req.params.id);
        const mode = user.modes && user.modes.length ? user.modes[0] : 'osu' // priority: current mode > default to osu
        const evaluation = await BnEvaluation.findById(evaluationId).populate(defaultNatEvaluationPopulate);

        // Send moved to discussion notification
        await discord.webhookPost(
            [{
                thumbnail: {
                    url: `https://a.ppy.sh/${evaluation.user.osuId}`,
                },
                color: discord.webhookColors.gray,
                description: `[**${evaluation.user.username}**'s NAT eval](https://bn.mappersguild.com/bneval?id=${evaluationId}) moved to group discussion`,
                fields: [
                    {
                        name: 'Summary',
                        value: comment.length > 950 ? comment.slice(0, 950) + '... *(truncated)*' : comment,
                    },
                    {
                        name: 'Assigned NAT leaders',
                        value: natLeaders.map(u => u.username).join(', '),
                    }
                ],
            }],
            mode
        );
        await discord.userHighlightWebhookPost(mode, discordIds);
    }
});

/* POST hide note */
router.post('/hideNote/:id', async (req, res) => {
    await Note.findByIdAndUpdate(req.params.id, { isHidden: true });

    res.json({
        success: 'Removed note',
    });

    let u = await User.findById(req.body.userId);
    Logger.generate(
        req.session.mongoId,
        `Removed user note from "${u.username}"`,
        'user',
        u._id
    );
});

/* POST edit note */
router.post('/editNote/:id', async (req, res) => {
    const note = await Note
        .findByIdAndUpdate(req.params.id, { comment: req.body.comment })
        .populate(defaultNotePopulate);

    res.json({
        note,
        success: 'Edited note',
    });

    let u = await User.findById(note.user);
    Logger.generate(
        req.session.mongoId,
        `edited user note for "${u.username}"`,
        'user',
        u._id
    );
});

/* POST toggle isTrialNat */
router.post('/:id/toggleIsTrialNat', middlewares.isNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    user.isTrialNat = !user.isTrialNat;
    await user.save();

    user.modes.forEach(async mode => {
        await discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.lightPink,
                description: `**${user.isTrialNat ? "Added" : "Removed"}** user [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) ${user.isTrialNat ? "to" : "from"} BN Evaluators`,
            }],
            mode
        );
        await util.sleep(500);
    });

    res.json({
        user,
        success: 'Toggled isTrialNat',
    });

    Logger.generate(
        req.session.mongoId,
        `Opted "${user.username}" ${user.isTrialNat ? 'in to' : 'out of'} trial NAT`,
        'user',
        user._id
    );
});

/* POST toggle isBannedFromBn */
router.post('/:id/toggleIsBannedFromBn', middlewares.isNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    user.isBannedFromBn = !user.isBannedFromBn;
    await user.save();

    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.lightPink,
            description: `**${user.isBannedFromBn ? "Banned" : "Unbanned"}** user [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) from BN`,
        }],
        'all'
    );

    res.json({
        user,
        success: 'Toggled isBannedFromBn',
    });

    Logger.generate(
        req.session.mongoId,
        `${user.isBannedFromBn ? "Banned" : "Unbanned"} user [**${user.username}**](https://osu.ppy.sh/users/${user.osuId}) from BN`,
        'user',
        user._id
    );
});

/* GET all users with badge info */
router.get('/findUserBadgeInfo/:userId', async (req, res) => {
    let badgeUsers;

    if (req.params.userId == 'false') {
        badgeUsers = await User.find({
            history: { $exists: true, $ne: [] },
        }).sort({ username: 1 });
    } else {
        badgeUsers = await User.find({
            _id: req.params.userId,
        });
    }

    const response = await osu.getClientCredentialsGrant();
    const token = response.access_token;

    const newUsers = [];
        
    for (let i = 0; i < badgeUsers.length; i++) {
        const user = badgeUsers[i];

        const mapperInfo = await osu.getOtherUserInfo(token, user.osuId);
        await util.sleep(50);

        const noms = mapperInfo.nominated_beatmapset_count;
        let thresholdNominationCount = 0;

        if (noms >= 200 && noms < 400) {
            thresholdNominationCount = 200;
        } else if (noms >= 400 && noms < 600) {
            thresholdNominationCount = 400;
        } else if (noms >= 600 && noms < 800) {
            thresholdNominationCount = 600;
        } else if (noms >= 800 && noms < 1000) {
            thresholdNominationCount = 800;
        } else if (noms >= 1000) {
            thresholdNominationCount = 1000;
        }

        newUsers.push({
            id: user.id,
            osuId: user.osuId,
            username: user.username,
            bnProfileBadge: user.bnProfileBadge,
            natProfileBadge: user.natProfileBadge,
            nominationsProfileBadge: user.nominationsProfileBadge,
            bnDuration: user.bnDuration += (30 * await scrap.findAdditionalBnMonths(user)),
            natDuration: user.natDuration,
            actualNominationsProfileBadge: thresholdNominationCount/200,
        });
    }

    res.json(newUsers);
});

/* GET all NAT users in evaluation bag for relevant mode */
router.get('/findBagUsers/:mode', async (req, res) => {
    const tempUsers = await User.find({
        groups: 'nat',
        'modesInfo.mode': req.params.mode,
        isBnEvaluator: true,
        inBag: true,
    }).sort({ username: 1 });

    const users = tempUsers.filter(u => u.evaluatorModes.includes(req.params.mode));

    res.json(users);
});

/* POST edit badge value */
router.post('/editBadgeValue/:id', async (req, res) => {
    let u = await User.findById(req.params.id);

    if (res.locals.userRequest.isNatLeader) {
        const type = req.body.group == 'bn' ? 'BN' : req.body.group == 'nat' ? 'NAT' : 'nomination';
        let originalValue;
        let value;
        let num = req.body.add ? 1 : -1;

        if (req.body.group == 'bn') {
            originalValue = u.bnProfileBadge;
            value = u.bnProfileBadge + num;
            await User.findByIdAndUpdate(req.params.id, { bnProfileBadge: value });
        } else if (req.body.group == 'nat') {
            originalValue = u.natProfileBadge;
            value = u.natProfileBadge + num;
            await User.findByIdAndUpdate(req.params.id, { natProfileBadge: value });
        } else if (req.body.group == 'nom') {
            originalValue = u.nominationsProfileBadge;
            value = u.nominationsProfileBadge + num;
            await User.findByIdAndUpdate(req.params.id, { nominationsProfileBadge: value });
        }

        await discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.lightPink,
                description: `Updated **${type}** badge value for user [**${u.username}**](https://osu.ppy.sh/users/${u.osuId}): **${req.body.group == 'nom' ? originalValue * 200 : originalValue} → ${req.body.group == 'nom' ? value * 200 : value}**`,
            }],
            'all'
        );
    }

    u = await User.findById(req.params.id);
    res.json(u);
});

module.exports = router;
