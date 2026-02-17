const express = require('express');
const config = require('../config.json');
const Aiess = require('../models/aiess');
const User = require('../models/user');
const Log = require('../models/log');
const Evaluation = require('../models/evaluations/evaluation');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const Review = require('../models/evaluations/review');
const getGeneralEvents = require('./evaluations/bnEval').getGeneralEvents;
const middlewares = require('../helpers/middlewares');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const Discussion = require('../models/discussion');
const { checkTenureOverlap, getModesFromHistory } = require('../helpers/scrap');

const router = express.Router();

/* AUTHENTICATION */
router.use((req, res, next) => {
    const secret = req.header('secret');
    const username = req.header('username');
    const isWs = req.header('Upgrade');

    if (!secret || !username || config.interOpAccess[username].secret !== secret) {
        if (isWs != 'websocket') return res.status(401).send({ error: 'Invalid credentials' });
    }

    return next();
});

// establish evaluation population
const evaluationPopulate = [
    { path: 'user', select: 'username osuId' },
    { path: 'bnEvaluators', select: 'username osuId' },
    { path: 'natEvaluators', select: 'username osuId' },
    {
        path: 'reviews',
        select: 'evaluator behaviorComment moddingComment vote',
        populate: {
            path: 'evaluator',
            select: 'username osuId groups isTrialNat',
        },
    },
];

/* GET test endpoint */
router.get('/', (req, res) => {
    res.status(200).send({ response: 'Connected', username: req.header('username') });
});

/* GET users in BN/NAT */
router.get('/users', async (_, res) => {
    res.json(await User.find({ groups: { $in: ['bn', 'nat'] } }));
});

/* GET users in or previously in BN/NAT */
router.get('/users/all', async (_, res) => {
    res.json(
        await User.find({
            $or: [
                { history: { $ne: [], $exists: true } },
            ],
        })
    );
});

/* GET users who were BN/NAT during a date range */
router.get('/users/byTenure', async (req, res) => {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    if (!startDate || !endDate) {
        return res.status(400).send({ error: 'startDate and endDate query parameters are required' });
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).send({ error: 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)' });
    }

    if (startDate > endDate) {
        return res.status(400).send({ error: 'startDate must be before or equal to endDate' });
    }

    const users = await User.find({
        history: { $ne: [], $exists: true },
    });

    const matchingUsers = [];

    for (const user of users) {
        if (!user.history || user.history.length === 0) continue;

        const bnHistory = user.history.filter(h => h.group === 'bn');
        const natHistory = user.history.filter(h => h.group === 'nat');

        const wasBn = checkTenureOverlap(bnHistory, startDate, endDate);
        const wasNat = checkTenureOverlap(natHistory, startDate, endDate);

        if (wasBn || wasNat) {
            // Start with user's current modes (excluding 'none')
            const inferredGameModes = new Set(
                (user.modes || []).filter(mode => mode !== 'none')
            );

            // Add modes from BN history within the date range
            const bnModes = getModesFromHistory(bnHistory, startDate, endDate);
            bnModes.forEach(mode => inferredGameModes.add(mode));

            // Add modes from NAT history within the date range
            const natModes = getModesFromHistory(natHistory, startDate, endDate);
            natModes.forEach(mode => inferredGameModes.add(mode));

            matchingUsers.push({
                username: user.username,
                osuId: user.osuId,
                modes: Array.from(inferredGameModes).sort(),
            });
        }
    }

    res.json(matchingUsers);
});

/* GET users who joined/left BN or NAT in a date range, as markdown tables */
router.get('/users/joinLeaveByDateRange', async (req, res) => {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    if (!startDate || !endDate) {
        return res.status(400).send({ error: 'Query parameters "startDate" and "endDate" are required (ISO 8601)' });
    }

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).send({ error: 'Invalid startDate or endDate' });
    }

    if (startDate > endDate) {
        return res.status(400).send({ error: 'startDate must be before or equal to endDate' });
    }

    const MODES = ['osu', 'taiko', 'catch', 'mania'];
    const modeLabel = (m) => (m === 'osu' ? 'osu!' : `osu!${m}`);

    const byMode = () => {
        const o = {};
        MODES.forEach(m => { o[m] = new Map(); }); // osuId -> username

        return o;
    };

    const bnAddedByMode = byMode();
    const bnDepartedByMode = byMode();
    const natAddedByMode = byMode();
    const natDepartedByMode = byMode();

    const users = await User.find({
        history: { $ne: [], $exists: true },
    });

    for (const user of users) {
        if (!user.history || user.history.length === 0) continue;

        for (const entry of user.history) {
            const entryDate = new Date(entry.date);
            // Include entry only when its date is within [startDate, endDate] (inclusive)
            if (entryDate < startDate || entryDate > endDate) continue;

            const mode = entry.mode || '';
            if (!MODES.includes(mode)) continue;

            if (entry.group === 'bn') {
                if (entry.kind === 'joined') bnAddedByMode[mode].set(user.osuId, user.username);
                else if (entry.kind === 'left') bnDepartedByMode[mode].set(user.osuId, user.username);
            } else if (entry.group === 'nat') {
                if (entry.kind === 'joined') natAddedByMode[mode].set(user.osuId, user.username);
                else if (entry.kind === 'left') natDepartedByMode[mode].set(user.osuId, user.username);
            }
        }
    }

    const profileUrl = (osuId) => `https://osu.ppy.sh/users/${osuId}`;

    const formatCell = (userMap) => {
        if (!userMap || userMap.size === 0) return '—';

        return Array.from(userMap.entries())
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([osuId, username]) => `[${username}](${profileUrl(osuId)})`)
            .join(', ');
    };

    const buildTable = (addedByMode, departedByMode) => {
        const rows = ['|  | Users |', '| :-- | :-- |'];

        for (const m of MODES) {
            rows.push(`| ![${modeLabel(m)}](/wiki/shared/mode/${m}.png "${modeLabel(m)}") Added | ${formatCell(addedByMode[m])} |`);
            rows.push(`| ![${modeLabel(m)}](/wiki/shared/mode/${m}.png "${modeLabel(m)}") Departed | ${formatCell(departedByMode[m])} |`);
        }

        return rows.join('\n');
    };

    const bnTable = buildTable(bnAddedByMode, bnDepartedByMode);
    const natTable = buildTable(natAddedByMode, natDepartedByMode);

    res.set('Content-Type', 'text/markdown');
    res.send(`#### Beatmap Nominators\n\n${bnTable}\n\n#### Nomination Assessment Team\n\n${natTable}`);
});

/* GET specific user info */
router.get('/users/:userInput', async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        res.status(404).send({ error: 'User not found' });
    }

    res.json(user);
});

/* POST events for multiple beatmapsets */
router.post('/events/byBeatmapsets', async (req, res) => {
    const beatmapsetIds = req.body.beatmapsetIds;

    if (!beatmapsetIds) {
        return res.status(400).send({ error: 'beatmapsetIds array is required in request body' });
    }

    if (!Array.isArray(beatmapsetIds)) {
        return res.status(400).send({ error: 'beatmapsetIds must be an array' });
    }

    if (beatmapsetIds.length === 0) {
        return res.status(400).send({ error: 'beatmapsetIds array cannot be empty' });
    }

    if (beatmapsetIds.length > 1000) {
        return res.status(400).send({ error: 'beatmapsetIds array cannot exceed 1000 items' });
    }

    const validIds = beatmapsetIds
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0);

    if (validIds.length === 0) {
        return res.status(400).send({ error: 'No valid beatmapset IDs provided' });
    }

    const events = await Aiess
        .find({ beatmapsetId: { $in: validIds } })
        .sort({ timestamp: 1 });

    res.json(events);
});

/* GET events for beatmapsetID */
router.get('/events/:beatmapsetId', async (req, res) => {
    res.json(
        await Aiess
            .find({ beatmapsetId: parseInt(req.params.beatmapsetId) })
            .sort({ timestamp: 1 })
    );
});

/* GET quality assurance events by user osu! ID */
// ! Deprecated
router.get('/qaEventsByUser/:osuId', async (req, res) => {
    res.status(410).send({ error: 'This endpoint is deprecated' });
});

/* GET all recent QA info */
// ! Deprecated
router.get('/qaInfo/', async (req, res) => {
    res.status(410).send({ error: 'This endpoint is deprecated' });
});

/* GET dq info for discussionID */
router.get('/dqInfoByDiscussionId/:discussionId', async (req, res) => {
    res.json(await Aiess.findOne({ discussionId: parseInt(req.params.discussionId) }));
});

/* GET activity by user and days */
router.get('/nominationResets/:userInput/:days/', async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    let days = parseInt(req.params.days);
    if (isNaN(days)) days = 90;
    else if (days > 10000) days = 9999;
    else if (days < 2) days = 2;

    let minDate = new Date();
    minDate.setDate(minDate.getDate() - days);
    let maxDate = new Date();

    res.json(await getGeneralEvents(user.osuId, user.id, user.modes, minDate, maxDate));
});

/* GET events created/updated after date */
router.get('/eventsByDate/:date', async (req, res) => {
    const date = new Date(req.params.date);

    if (isNaN(date.getTime())) {
        return res.status(404).send({ error: 'Invalid date' });
    }

    const logs = await Log
        .find({
            createdAt: { $gt: date },
            category: 'dataCollection',
        })
        .populate([
            { path: 'user', select: 'username osuId' },
            { path: 'relatedId', select: 'obviousness severity discussionId' },
        ])
        .sort({ createdAt: -1 });

    res.json(logs);
});

/* GET content review */
router.get('/contentReview/:limit', async (req, res) => {
    let limit = parseInt(req.params.limit);

    if (isNaN(limit)) {
        return res.status(404).send({ error: 'Invalid limit' });
    }

    if (limit > 100) {
        limit = 100;
    }

    res.json(
        await Discussion
            .find({
                isNatOnly: false,
                mode: 'all',
                discussionLink: { $exists: true },
                title: { $regex: 'Content review' },
            })
            .limit(limit)
            .select('discussionLink shortReason title')
            .sort({ createdAt: -1 })
    );
});

// ! NAT-only endpoints

/* GET latest evaluation or appevaluation */
router.get('/latestEvaluation/:userInput', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    const latestEvaluation = await Evaluation
        .findOne(
            {
                user: user._id,
                $or: [
                    { consensus: { $exists: true } },
                    { kind: 'resignation' },
                ],
            },
            {
                feedback: 0,
            })
        .sort({ updatedAt: -1 });

    const latestAppEvaluation = await AppEvaluation
        .findOne(
            {
                user: user._id,
                consensus: { $exists: true },
            },
            {
                feedback: 0,
            })
        .sort({ updatedAt: -1 });

    if (!latestEvaluation && !latestAppEvaluation) {
        return res.status(404).send({ error: 'User has no recent BN evaluation logged' });
    }

    let evaluation;

    if (latestEvaluation && latestAppEvaluation) {
        if (latestEvaluation.updatedAt > latestAppEvaluation.updatedAt) {
            evaluation = latestEvaluation;
        } else {
            evaluation = latestAppEvaluation;
        }
    } else if (latestEvaluation) {
        evaluation = latestEvaluation;
    } else if (latestAppEvaluation) {
        evaluation = latestAppEvaluation;
    }

    res.json(evaluation);
});

/* GET general reason for BN removal */
router.get('/bnRemoval/:userInput', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    const latestEvaluation = await Evaluation
        .findOne({
            user: user._id,
            active: false,
            consensus: { $exists: true },
        })
        .sort({ $natural: -1 });

    if (!latestEvaluation) {
        return res.status(404).send({ error: 'User has no BN removal logged' });
    }

    const action = latestEvaluation.isResignation ? 'resign' : latestEvaluation.consensus;
    const addition = action === 'resign' ? latestEvaluation.consensus : latestEvaluation.addition;

    res.json({
        action,
        addition,
        timestamp: latestEvaluation.archivedAt,
    } );
});

/* GET all of a user's logs */
router.get('/logs/:userInput/:category', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    const logs = await Log
        .find({
            user: user._id,
            category: req.params.category,
        })
        .sort({ $natural: -1 });

    if (!logs || !logs.length) {
        return res.status(404).send({
            error: `User has no ${req.params.category} logs. Be sure your category is one of the following: 
            'account',
            'user',
            'application',
            'appEvaluation',
            'bnEvaluation',
            'dataCollection',
            'discussionVote',
            'report',
            'test', (no longer used)
            'qualityAssurance',
            'veto',
            'spam',
            'bnFinder' (no longer used),
            'notableNameChanges',
            'documentation'`,
        });
    }

    res.json(logs);
});

/* GET a user's submitted evaluations */
router.get('/submittedEvaluations/:userInput/:days', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);
    const days = parseInt(req.params.days);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    if (isNaN(days)) {
        return res.status(404).send({ error: 'Invalid days count' });
    }

    let date = new Date();
    date.setDate(date.getDate() - days);

    // find submitted evaluations
    const submittedEvaluations = [];

    const reviews = await Review
        .find({
            evaluator: user._id,
            createdAt: { $gt: date },
        });

    for (const review of reviews) {
        let evaluation;

        // check for app
        evaluation = await AppEvaluation
            .findOne({
                reviews: review._id,
            })
            .populate(evaluationPopulate);

        if (!evaluation) {
            evaluation = await BnEvaluation
                .findOne({
                    reviews: review._id,
                })
                .populate(evaluationPopulate);
        }

        submittedEvaluations.push(evaluation);
    }

    res.json(submittedEvaluations);
});

/* GET a user's assigned evaluations */
router.get('/assignedEvaluations/:userInput/:days', middlewares.hasPrivateInterOpsAccess, async (req, res) => {
    const user = await User.findByUsernameOrOsuId(req.params.userInput);

    const days = parseInt(req.params.days);

    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    if (isNaN(days)) {
        return res.status(404).send({ error: 'Invalid days count' });
    }

    let date = new Date();
    date.setDate(date.getDate() - days);

    // find assigned evaluations (regardless of whether or not they were acted upon)
    const assignedApplications = await AppEvaluation
        .find({
            natEvaluators: user._id,
            $or: [
                { active: true },
                {
                    active: false,
                    consensus: { $exists: true },
                },
            ],
            createdAt: { $gt: date },
        })
        .populate(evaluationPopulate);

    const assignedEvaluations = await Evaluation
        .find({
            natEvaluators: user._id,
            $or: [
                { active: true },
                {
                    active: false,
                    consensus: { $exists: true },
                },
            ],
            createdAt: { $gt: date },
        })
        .populate(evaluationPopulate);

    res.json({
        assignedApplications,
        assignedEvaluations,
    });
});

module.exports = router;
