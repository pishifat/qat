const express = require('express');
const middlewares = require('../helpers/middlewares');
const Settings = require('../models/settings');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNat);

/* GET global settings */
router.get('/', async (req, res) => {
    const settings = await Settings.findOne();

    res.json(settings);
});

/* POST update global settings */
router.post('/update', async (req, res) => {
    const modeSettings = req.body.modeSettings;
    const settings = await Settings.findOne();
    settings.modeSettings = modeSettings;
    await settings.save();

    res.json({
        success: 'updated',
    });
});

/* POST toggle hasTrialNat */
router.post('/toggleHasTrialNat', async (req, res) => {
    const mode = req.body.mode;
    const settings = await Settings.findOne();
    const settingIndex = settings.modeSettings.findIndex(s => s.mode === mode);

    settings.modeSettings[settingIndex].hasTrialNat = !settings.modeSettings[settingIndex].hasTrialNat;
    await settings.save();

    res.json({
        success: 'updated',
    });
});

module.exports = router;
