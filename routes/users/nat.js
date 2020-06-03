const express = require('express');
const api = require('../../helpers/api');
const User = require('../../models/user');
const Logger = require('../../models/log');
const Note = require('../../models/note');
const BnApp = require('../../models/bnApp');

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

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
        `Added user note to "${u.username}"`
    );

    api.webhookPost(
        [{
            author: api.defaultWebhookAuthor(req.session),
            color: api.webhookColors.brown,
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
        `Removed user note from "${u.username}"`
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
        `edited user note for "${u.username}"`
    );
});

/* GET all users with badge info */
router.get('/findUserBadgeInfo', async (req, res) => {
    const u = await User.find({
        $or: [
            { 'bnDuration.0': { $exists: true } },
            { 'natDuration.0': { $exists: true } },
        ],
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
            group: 'bn',
            isSpectator: { $ne: true },
            isBnEvaluator: true,
        }).sort({ username: 1 }),

        BnApp.find({
            bnEvaluators: {
                $exists: true,
                $not: { $size: 0 },
            },
            active: false,
        }).populate([
            { path: 'applicant', select: 'username osuId' },
            { path: 'bnEvaluators', select: 'username osuId' },
            { path: 'test', select: 'totalScore' },
            {
                path: 'evaluations',
                select: 'evaluator behaviorComment moddingComment vote',
                populate: {
                    path: 'evaluator',
                    select: 'username osuId group',
                },
            },
        ]),
    ]);

    let info = [];
    users.forEach(user => {
        const evaluatedApps = applications.filter(app => {
            return app.evaluations.some(evaluation => evaluation.evaluator.id == user.id);
        });

        info.push({
            username: user.username,
            osuId: user.osuId,
            modes: user.modes,
            evaluatedApps,
        });
    });

    res.json(info);
});

module.exports = router;
