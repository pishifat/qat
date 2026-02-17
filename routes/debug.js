const express = require('express');
const config = require('../config.json');
const middlewares = require('../helpers/middlewares');
const User = require('../models/user');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isPishifat);

/* POST move user to NAT */
router.post('/moveToNat', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    user.isTrialNat = false;
    const i = user.groups.findIndex((g) => g === 'bn');
    if (i !== -1) user.groups.splice(i, 1, 'nat');
    else user.groups.push('nat');

    for (let i = 0; i < user.modesInfo.length; i++) {
        user.modesInfo[i].level = 'evaluator';
    }

    await user.save();

    res.json({
        user,
        success: 'moved to NAT',
    });
});

/* POST move user to trial NAT */
router.post('/moveToTrialNat', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    user.isTrialNat = true;
    const i = user.groups.findIndex((g) => g === 'nat');
    if (i !== -1) user.groups.splice(i, 1, 'bn');
    await user.save();

    for (let i = 0; i < user.modesInfo.length; i++) {
        user.modesInfo[i].level = 'full';
    }

    res.json({
        user,
        success: 'moved to BN Evaluator',
    });
});

/* POST move user to GMT */
router.post('/moveToGmt', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    if (!user.groups.includes('gmt')) user.groups.push('gmt');
    await user.save();

    res.json({
        user,
        success: 'moved to GMT',
    });
});

/* POST remove user from GMT */
router.post('/removeFromGmt', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });

    if (user.groups.includes('gmt')) {
        const i = user.groups.findIndex((g) => g === 'gmt');
        user.groups.splice(i, 1);
    }

    await user.save();

    res.json({
        user,
        success: 'removed from GMT',
    });
});

/* POST move user to user */
router.post('/moveToUser', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    user.groups = ['user'];
    user.modesInfo = [];
    user.modes = [];
    user.fullModes = [];
    user.probationModes = [];
    await user.save();

    res.json({
        user,
        success: 'moved to user',
    });
});

/* POST move user to full BN */
router.post('/moveToBn/:mode', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    const mode = req.params.mode;
    user.isTrialNat = false;
    if (!user.groups.includes('bn')) user.groups.push('bn');
    const i = user.groups.findIndex((g) => g === 'nat');
    if (i !== -1) user.groups.splice(i, 1);
    if (!user.modes.includes(mode)) user.modes.push(mode);
    if (!user.fullModes.includes(mode)) user.modes.push(mode);

    if (user.probationModes.includes(mode)) {
        const i = user.probationModes.findIndex((g) => g === mode);
        user.probationModes.splice(i, 1);
    }

    const found = user.modesInfo.find((m) => m.mode === mode);

    if (!found) user.modesInfo.push({ mode, level: 'full' });
    else {
        user.modesInfo.forEach((m) => {
            if (m.mode === mode) m.level = 'full';
        });
    }

    await user.save();

    res.json({
        user,
        success: `moved to osu!${mode == 'osu' ? '' : mode } BN`,
    });
});

/* POST remove user from full or probation BN */
router.post('/removeFromBn/:mode', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    const mode = req.params.mode;
    user.isTrialNat = false;

    if (user.modes.includes(mode)) {
        const i = user.modes.findIndex((g) => g === mode);
        user.modes.splice(i, 1);
    }

    if (user.fullModes.includes(mode)) {
        const i = user.fullModes.findIndex((g) => g === mode);
        user.fullModes.splice(i, 1);
    }

    if (user.probationModes.includes(mode)) {
        const i = user.probationModes.findIndex((g) => g === mode);
        user.probationModes.splice(i, 1);
    }

    const found = user.modesInfo.find((m) => m.mode === mode);

    if (found) {
        const i = user.modesInfo.findIndex((m) => m.mode === mode);
        user.modesInfo.splice(i, 1);
    }

    await user.save();

    res.json({
        user,
        success: `removed from osu!${mode == 'osu' ? '' : mode } probation/full BN`,
    });

});

/* POST move user to probation BN */
router.post('/moveToProbation/:mode', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    const mode = req.params.mode;
    user.isTrialNat = false;
    if (!user.groups.includes('bn')) user.groups.push('bn');
    const i = user.groups.findIndex((g) => g === 'nat');
    if (i !== -1) user.groups.splice(i, 1);
    if (!user.modes.includes(mode)) user.modes.push(mode);
    if (!user.probationModes.includes(mode)) user.modes.push(mode);

    if (user.fullModes.includes(mode)) {
        const i = user.fullModes.findIndex((g) => g === mode);
        user.fullModes.splice(i, 1);
    }

    const found = user.modesInfo.find((m) => m.mode === mode);

    if (!found) user.modesInfo.push({ mode, level: 'probation' });
    else {
        user.modesInfo.forEach((m) => {
            if (m.mode === mode) m.level = 'probation';
        });
    }

    await user.save();

    res.json({
        user,
        success: `moved to osu!${mode == 'osu' ? '' : mode } probation BN`,
    });
});

/* POST move user to NAT leader */
router.post('/toggleIsNatLeader', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    user.isNatLeader = !user.isNatLeader;
    await user.save();

    res.json({
        user,
        success: `toggled isNatLeader`,
    });
});

/* POST move user to structural NAT */
router.post('/moveToStructuralNat', async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    user.modesInfo = [
        { mode: 'none', level: 'evaluator' },
    ];
    user.modes = ['none'];
    user.evaluatorModes = ['none'];
    await user.save();

    res.json({
        user,
        success: `moved to structural NAT`,
    });
});

/* GET session info */
router.get('/session', async (req, res) => {
    res.json({
        session: req.session,
    });
});

/* POST update session info */
router.post('/updateSession', async (req, res) => {
    req.session.mongoId = req.body.mongoId;
    req.session.osuId = Number(req.body.osuId);
    req.session.username = req.body.username;
    req.session.groups = req.body.groups.split(',');

    res.json({
        success: 'updated session',
        session: req.session,
    });
});

module.exports = router;
