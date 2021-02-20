const express = require('express');
const User = require('../../models/user');
const Logger = require('../../models/log');
const Note = require('../../models/note');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');

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
    let note = await Note.create({
        author: req.session.mongoId,
        user: req.params.id,
        comment: req.body.comment,
    });
    note = await Note
        .findById(note._id)
        .populate(defaultNotePopulate);

    res.json(note);

    let u = await User.findById(req.params.id);

    Logger.generate(
        req.session.mongoId,
        `Added user note to "${u.username}"`,
        'user',
        u._id
    );

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.brown,
            description: `Added note to [**${note.user.username}**'s profile](http://bn.mappersguild.com/users?id=${note.user.id})`,
            fields: [
                {
                    name: 'Note',
                    value: req.body.comment.length > 950 ? req.body.comment.slice(0,950) + '... *(truncated)*' : req.body.comment,
                },
            ],
        }],
        u.modes[0]
    );
});

/* POST hide note */
router.post('/hideNote/:id', async (req, res) => {
    await Note.findByIdAndUpdate(req.params.id, { isHidden: true });

    res.json({});
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
    const n = await Note
        .findByIdAndUpdate(req.params.id, { comment: req.body.comment })
        .populate(defaultNotePopulate);

    res.json(n);
    let u = await User.findById(n.user);
    Logger.generate(
        req.session.mongoId,
        `edited user note for "${u.username}"`,
        'user',
        u._id
    );
});

/* GET all users with badge info */
router.get('/findUserBadgeInfo', async (req, res) => {
    const u = await User.find({
        history: { $exists: true, $ne: [] },
    }).sort({ username: 1 });

    res.json(u);
});

/* POST edit badge value */
router.post('/editBadgeValue/:id', async (req, res) => {
    let u = await User.findById(req.params.id);

    if (res.locals.userRequest.osuId == '3178418') { //i dont want anyone else messing with this
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
            username: user.username,
            osuId: user.osuId,
            modes: user.modes,
            evaluatedApps: evaluatedApps.length,
        });
    });

    res.json(info);
});

module.exports = router;
