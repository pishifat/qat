const express = require('express');
const middlewares = require('../helpers/middlewares');
const Logger = require('../models/log');
const osuBot = require('../helpers/osuBot');
const User = require('../models/user');
const discord = require('../helpers/discord');
const Announcement = require('../models/announcement');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNat);

/* POST spam messages */
router.post('/sendMessages', middlewares.isAdmin, async (req, res) => {
    const channel = {
        name: req.body.title,
        description: req.body.description,
    };

    let osuIds = req.body.users.split(',');

    if (!osuIds.find(id => id == req.session.osuId))
        osuIds.push(req.session.osuId);

    const message = await osuBot.sendAnnouncement(osuIds, channel, req.body.message);

    if (message !== true) {
        return res.json({ error: message.error ? message.error : `Messages were not sent.` });
    }

    res.json({ success: 'Message sent! A copy was sent to you for confirmation' });

    Logger.generate(
        req.session.mongoId,
        `Spammed messages through NAT bot`,
        'spam',
        null
    );
});

/* GET user osu! IDs */
router.get('/findUserOsuIds/:group/:mode', async (req, res) => {
    let users;
    const group = req.params.group;
    const mode = req.params.mode;

    if (group !== 'all' && mode !== 'all') {
        users = await User
            .find({
                modesInfo: { $elemMatch: { mode } },
                groups: { $in: [group] },
            });
    } else if (group !== 'all' && mode == 'all') {
        users = await User
            .find({
                groups: { $in: [group] },
            });
    } else if (group == 'all' && mode !== 'all') {
        users = await User
            .find({
                modesInfo: { $elemMatch: { mode } },
            });
    } else if (group == 'all' && mode == 'all') {
        users = await User
            .find({
                groups: { $in: ['bn', 'nat'] },
            });
    }

    const userOsuIds = users.map(u => u.osuId);

    res.json(userOsuIds);
});

/* POST spam messages */
router.post('/sendAnnouncement', middlewares.isNat, async (req, res) => {
    const content = req.body.announcement;
    const title = req.body.title;
    const roles = req.body.roles;

    // bnsite

    const announcement = await Announcement.create({
        author: req.session.mongoId,
        content,
        title,
        roles,
    });

    // discord

    await discord.roleHighlightWebhookPost('announcement', roles);
    await discord.announcementWebhookPost(req.session, title, content);

    res.json({ success: 'Announcement sent' });

    Logger.generate(
        req.session.mongoId,
        `Published an announcement`,
        'spam',
        announcement._id
    );
});

module.exports = router;
