const express = require('express');
const Penalty = require('../models/penalty');
const User = require('../models/user');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');
const discord = require('../helpers/discord');
const util = require('../helpers/util');
const bnRiskService = require('../services/bnRiskService');
const { PenaltyType, PenaltySeverity } = require('../shared/enums');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNatOrTrialNat);

const defaultPopulate = [
    { path: 'createdBy', select: 'username osuId' },
    { path: 'user', select: 'username osuId modesInfo groups' },
];

const TYPE_VALUES = Object.values(PenaltyType);
const SEVERITY_VALUES = Object.values(PenaltySeverity);

function canEditPenalty(viewer, penalty) {
    if (!viewer) return false;
    if (viewer.isNatLeader) return true;

    const creatorId = penalty.createdBy && (penalty.createdBy.id || penalty.createdBy._id || penalty.createdBy);

    return creatorId && String(creatorId) === String(viewer.id);
}

function serializePenalty(penalty, viewer) {
    const obj = penalty.toObject ? penalty.toObject() : penalty;

    obj.canEdit = canEditPenalty(viewer, penalty);
    obj.canDelete = Boolean(viewer && viewer.isNatLeader);

    return obj;
}

function typeLabel(type) {
    switch (type) {
        case PenaltyType.MappingQuality: return 'Mapping Quality';
        case PenaltyType.ModdingQuality: return 'Modding Quality';
        case PenaltyType.Behavior: return 'Behaviour';
        default: return 'Other';
    }
}

function severityLabel(severity) {
    return severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : '';
}

function penaltyWebhook(session, color, action, penalty) {
    const user = penalty.user || {};
    const userId = user.id || user._id;
    const fields = [
        {
            name: 'Reason',
            value: util.shorten(penalty.reason, 1024) || '-',
        },
    ];

    discord.webhookPost([{
        author: discord.defaultWebhookAuthor(session),
        color,
        description: `${action} **${severityLabel(penalty.severity)}** ${typeLabel(penalty.type)} penalty for [**${user.username}**](http://bn.mappersguild.com/users?id=${userId})`,
        fields,
    }], penalty.mode);
}

/* GET penalties for a user */
router.get('/user/:userId', async (req, res) => {
    const query = { user: req.params.userId };

    if (req.query.mode) {
        if (!bnRiskService.isGameplayMode(req.query.mode)) {
            return res.json({ error: 'Invalid mode' });
        }

        query.mode = req.query.mode;
    }

    const penalties = await Penalty
        .find(query)
        .populate(defaultPopulate)
        .sort({ createdAt: -1 });

    res.json({
        penalties: penalties.map(penalty => serializePenalty(penalty, res.locals.userRequest)),
    });
});

/* POST create penalty */
router.post('/', async (req, res) => {
    const { userId, mode, type, severity, reason } = req.body;

    if (!userId || !mode || !type || !severity || !reason || !String(reason).trim()) {
        return res.json({ error: 'Mode, type, severity, and reason are required' });
    }

    if (!bnRiskService.isGameplayMode(mode)) {
        return res.json({ error: 'Invalid mode' });
    }

    if (!TYPE_VALUES.includes(type) || !SEVERITY_VALUES.includes(severity)) {
        return res.json({ error: 'Invalid type or severity' });
    }

    await User.findById(userId).orFail();

    const penalty = await Penalty.create({
        user: userId,
        mode,
        type,
        severity,
        reason: String(reason).trim(),
        createdBy: res.locals.userRequest.id,
    });

    await penalty.populate(defaultPopulate);
    await bnRiskService.recalculateActiveBnEval(userId, mode);

    Logger.generate(
        req.session.mongoId,
        `Created ${severity} ${type} penalty for user ${userId} (${mode})`,
        'penalty',
        penalty._id,
        { after: { mode, type, severity, reason: penalty.reason } }
    );

    res.json({
        penalty: serializePenalty(penalty, res.locals.userRequest),
        success: 'Penalty recorded',
    });

    penaltyWebhook(req.session, discord.webhookColors.brown, 'Created', penalty);
});

/* PATCH edit penalty */
router.patch('/:id', async (req, res) => {
    const penalty = await Penalty
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    if (!canEditPenalty(res.locals.userRequest, penalty)) {
        return res.json({ error: 'You cannot edit this penalty' });
    }

    const before = {
        mode: penalty.mode,
        type: penalty.type,
        severity: penalty.severity,
        reason: penalty.reason,
    };

    if (req.body.mode) {
        if (!bnRiskService.isGameplayMode(req.body.mode)) {
            return res.json({ error: 'Invalid mode' });
        }

        penalty.mode = req.body.mode;
    }

    if (req.body.type) {
        if (!TYPE_VALUES.includes(req.body.type)) {
            return res.json({ error: 'Invalid type' });
        }

        penalty.type = req.body.type;
    }

    if (req.body.severity) {
        if (!SEVERITY_VALUES.includes(req.body.severity)) {
            return res.json({ error: 'Invalid severity' });
        }

        penalty.severity = req.body.severity;
    }

    if (req.body.reason !== undefined) {
        if (!String(req.body.reason).trim()) {
            return res.json({ error: 'Reason is required' });
        }

        penalty.reason = String(req.body.reason).trim();
    }

    await penalty.save();
    await penalty.populate(defaultPopulate);

    const userId = penalty.user.id || penalty.user._id;
    const modesToRecalc = new Set([before.mode, penalty.mode]);

    for (const mode of modesToRecalc) {
        await bnRiskService.recalculateActiveBnEval(userId, mode);
    }

    Logger.generate(
        req.session.mongoId,
        `Edited penalty ${penalty.id}`,
        'penalty',
        penalty._id,
        { before, after: {
            mode: penalty.mode,
            type: penalty.type,
            severity: penalty.severity,
            reason: penalty.reason,
        } }
    );

    res.json({
        penalty: serializePenalty(penalty, res.locals.userRequest),
        success: 'Penalty updated',
    });

    penaltyWebhook(req.session, discord.webhookColors.orange, 'Edited', penalty);
});

/* DELETE penalty */
router.delete('/:id', middlewares.isNatLeader, async (req, res) => {
    const penalty = await Penalty
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const userId = penalty.user.id || penalty.user._id;
    const mode = penalty.mode;
    const webhookPenalty = {
        user: penalty.user,
        mode: penalty.mode,
        type: penalty.type,
        severity: penalty.severity,
        reason: penalty.reason,
    };
    const before = {
        mode: penalty.mode,
        type: penalty.type,
        severity: penalty.severity,
        reason: penalty.reason,
    };

    await penalty.deleteOne();
    await bnRiskService.recalculateActiveBnEval(userId, mode);

    Logger.generate(
        req.session.mongoId,
        `Deleted penalty ${req.params.id}`,
        'penalty',
        req.params.id,
        { before }
    );

    res.json({ success: 'Penalty deleted' });

    penaltyWebhook(req.session, discord.webhookColors.black, 'Deleted', webhookPenalty);
});

module.exports = router;
