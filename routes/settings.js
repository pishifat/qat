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

/* POST create initial global settings - delete later */
router.post('/create', async (req, res) => {
    const existingSettings = await Settings.findOne();

    if (existingSettings) {
        return res.json({
            error: 'Already created',
        });
    }

    const modes = ['osu', 'catch', 'taiko', 'mania'];
    const modeSettings = modes.map(mode => ({
        mode,
        evalsRequired: 3,
    }));

    const settings = new Settings();
    settings.modeSettings = modeSettings;
    await settings.save();

    res.json({
        success: 'updated',
    });
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

module.exports = router;
