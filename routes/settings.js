const express = require('express');
const middlewares = require('../helpers/middlewares');
const Settings = require('../models/settings');
const util = require('../helpers/util');
const discord = require('../helpers/discord');
const webhookConfig = require('../helpers/webhookConfig.js');

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
    const parsedMode = `osu!${mode !== "osu" ? mode : ""}`;
    const settings = await Settings.findOne();
    const settingIndex = settings.modeSettings.findIndex(s => s.mode === mode);

    settings.modeSettings[settingIndex].hasTrialNat = !settings.modeSettings[settingIndex].hasTrialNat;
    await settings.save();

    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.pink,
            description: `**${settings.modeSettings[settingIndex].hasTrialNat ? "Enabled" : "Disabled"}** BN evaluators for **${parsedMode}**`,
        }],
        mode
    );
    await util.sleep(500);

    res.json({
        success: 'toggled hasTrialNat',
    });
});

/* GET webhooks */
router.get('/webhooks', async (req, res) => {
    const config = webhookConfig.get();

    res.json(config);
});

/* POST update webhooks */
router.post('/updateWebhooks', async (req, res) => {
    const { webhook, id, token } = req.body;

    webhookConfig.update(webhook, id, token);

    res.json({
        success: 'updated webhook',
    });
});

module.exports = router;
