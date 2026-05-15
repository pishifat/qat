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
    const parsedMode = `osu!${mode !== 'osu' ? mode : ''}`;
    const settings = await Settings.findOne();
    const settingIndex = settings.modeSettings.findIndex(s => s.mode === mode);

    settings.modeSettings[settingIndex].hasTrialNat = !settings.modeSettings[settingIndex].hasTrialNat;
    await settings.save();

    await discord.webhookPost(
        [{
            // @ts-ignore
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.pink,
            description: `**${settings.modeSettings[settingIndex].hasTrialNat ? 'Enabled' : 'Disabled'}** BN evaluators for **${parsedMode}**`,
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
router.post('/webhooks/update', async (req, res) => {
    const webhook = req.body.webhook;
    const id = req.body.id;
    const token = req.body.token;

    const priorEntry = webhookConfig.get()[webhook];
    const priorCreds =
        priorEntry && typeof priorEntry === 'object'
            ? {
                id: priorEntry.id,
                token: priorEntry.token,
                threadId: priorEntry.threadId,
            }
            : {};

    const sessionAuthor = discord.defaultWebhookAuthor(req.session);
    const successEmbeds = [
        {
            author: sessionAuthor,
            color: discord.webhookColors.lightBlue,
            description: `Updated location of webhook \`${webhook}\``,
        },
    ];

    try {
        await webhookConfig.update(webhook, id, token);
    } catch (err) {
        console.error('[settings] webhooks/update write failed:', err);
        await discord.webhookPostByCredentials(priorCreds, [
            {
                author: sessionAuthor,
                color: discord.webhookColors.darkYellow,
                description: `Could not save \`${webhook}\` to disk (previous credentials are unchanged).`,
            },
        ]);

        return res.status(500).json({
            error: 'Could not write webhooks configuration',
        });
    }

    const entry = webhookConfig.get()[webhook];

    try {
        await discord.webhookPostByCredentialsOrThrow(entry, successEmbeds);
    } catch (err) {
        console.error('[settings] webhooks/update confirmation post failed:', err);
        await discord.webhookPostByCredentials(priorCreds, [
            {
                author: sessionAuthor,
                color: discord.webhookColors.darkYellow,
                description: `New credentials for \`${webhook}\` were saved, but the confirmation message failed to reach the new webhook. Verify the ID and token.`,
            },
        ]);

        return res.json({
            success: `updated ${webhook}`,
            pingOk: false,
        });
    }

    res.json({
        success: `updated ${webhook}`,
        pingOk: true,
    });
});

module.exports = router;
