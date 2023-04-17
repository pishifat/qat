const express = require('express');
const User = require('../../models/user');
const Logger = require('../../models/log');
const Note = require('../../models/note');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const scrap = require('../../helpers/scrap');
const config = require('../../config.json');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNat);

const defaultNotePopulate = [
    { path: 'author', select: 'username osuId' },
    { path: 'user', select: 'username osuId' },
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
        const discordIds = natLeaders.map(u => u.discordId);
        
        await BnEvaluation.findByIdAndUpdate(evaluationId, {
            selfSummary: note._id,
            discussion: true,
            natEvaluators: natLeaders.map(u => u._id),
        });

        const user = await User.findById(req.params.id);
        const mode = user.modes && user.modes.length ? user.modes[0] : 'osu' //priority: current mode > default to osu

        await discord.userHighlightWebhookPost(mode, discordIds);
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

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.brown,
            description: `Added ${isWarning ? '**warning** note' : isSummary ? '**summary** note' : 'note'} to [**${note.user.username}**'s profile](http://bn.mappersguild.com/users?id=${note.user.id})`,
            fields: [
                {
                    name: 'Note',
                    value: comment.length > 950 ? comment.slice(0, 950) + '... *(truncated)*' : comment,
                },
            ],
        }],
        u.modes && u.modes.length ? u.modes[0] : u.history && u.history.length ? u.history[0].mode : 'osu' //priority: current mode > past mode > default to osu
    );
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

/* GET all users with badge info */
router.get('/findUserBadgeInfo', async (req, res) => {
    const badgeUsers = await User.find({
        history: { $exists: true, $ne: [] },
    }).sort({ username: 1 });

    const newUsers = [];

    for (let i = 0; i < badgeUsers.length; i++) {
        const user = badgeUsers[i];

        newUsers.push({
            id: user.id,
            osuId: user.osuId,
            username: user.username,
            bnProfileBadge: user.bnProfileBadge,
            natProfileBadge: user.natProfileBadge,
            bnDuration: user.bnDuration += (30 * await scrap.findAdditionalBnMonths(user)),
            natDuration: user.natDuration,
        });
    }

    res.json(newUsers);
});

/* GET all NAT users in evaluation bag for relevant mode */
router.get('/findBagUsers/:mode', async (req, res) => {
    const u = await User.find({
        groups: 'nat',
        'modesInfo.mode': req.params.mode,
        isBnEvaluator: true,
        inBag: true,
    }).sort({ username: 1 });

    res.json(u);
});

/* POST edit badge value */
router.post('/editBadgeValue/:id', async (req, res) => {
    let u = await User.findById(req.params.id);

    if (res.locals.userRequest.isResponsibleWithButtons) {
        let years;
        let num = req.body.add ? 1 : -1;

        if (req.body.group == 'bn') {
            years = u.bnProfileBadge + num;
            await User.findByIdAndUpdate(req.params.id, { bnProfileBadge: years });
        } else {
            years = u.natProfileBadge + num;
            await User.findByIdAndUpdate(req.params.id, { natProfileBadge: years });
        }
    }

    u = await User.findById(req.params.id);
    res.json(u);
});

/* GET potential NAT info */
router.get('/findPotentialNatInfo', async (req, res) => {
    const [users, applications] = await Promise.all([
        User.find({
            groups: 'bn',
            isBnEvaluator: true,
        }).sort({ username: 1 }),

        AppEvaluation.find({
            bnEvaluators: {
                $exists: true,
                $not: { $size: 0 },
            },
            active: false,
        }).populate([
            { path: 'bnEvaluators', select: 'username osuId groups' },
            {
                path: 'reviews',
                select: 'evaluator',
                populate: {
                    path: 'evaluator',
                    select: 'username osuId groups',
                },
            },
        ]),
    ]);

    let info = [];
    users.forEach(user => {
        const evaluatedApps = applications.filter(app => {
            return app.reviews.some(review => review.evaluator.id == user.id);
        });

        info.push({
            id: user.id,
            username: user.username,
            osuId: user.osuId,
            modes: user.modes,
            evaluatedApps: evaluatedApps.length,
        });
    });

    res.json(info);
});

module.exports = router;
