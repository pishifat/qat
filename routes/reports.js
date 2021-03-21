const express = require('express');
const Report = require('../models/report');
const User = require('../models/user');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const discord = require('../helpers/discord');

const router = express.Router();

router.use(middlewares.isLoggedIn);

/* POST submit report (Report) */
router.post('/submitReport/', middlewares.isLoggedIn, async (req, res) => {
    const link = req.body.link;
    const username = req.body.username;
    let validUrl = util.isValidUrl(link);

    if (!username && !link) {
        return res.json({ error: 'You must include a username or a link' });
    }

    const report = new Report();
    report.reporter = req.session.mongoId;
    report.reason = req.body.reason && req.body.reason.length ? req.body.reason : 'No additional information';
    report.category = req.body.category;

    if (validUrl) {
        report.link = link;
    }

    let notificationFields = [{
        name: 'Report reason',
        value: req.body.reason.length > 975 ? req.body.reason.slice(0,975) + '... *(truncated)*' : req.body.reason,
    }];

    if (validUrl) {
        notificationFields.push({
            name: 'Relevant link',
            value: link,
        });
    }

    let reportCategory;

    switch (req.body.category) {
        case 'stolenBeatmap':
            reportCategory = 'Stolen beatmap report';
            break;
        case 'contentCaseSong':
            reportCategory = 'Song content report';
            break;
        case 'contentCaseVisual':
            reportCategory = 'Visual content report';
            break;
        case 'behavior':
            reportCategory = 'User behavior report';
            break;
        default:
            reportCategory = 'Other report';
            break;
    }

    if (req.body.username) {
        let u = await User.findByUsername(req.body.username);

        if (!u) {
            return res.json({ error: 'Cannot find user! Make sure you spelled it correctly' });
        }

        if (!u.isBnOrNat) {
            return res.json({ error: 'User is not a member of the BN/NAT!' });
        }

        report.culprit = u.id;
        await report.save();

        res.json({
            success: 'ok',
        });

        // for #user-reportfeed
        await discord.webhookPost(
            [{
                thumbnail: {
                    url: `https://a.ppy.sh/${u.osuId}`,
                },
                color: discord.webhookColors.darkRed,
                description: `[${reportCategory}](http://bn.mappersguild.com/managereports?id=${report.id}) for **${u.username}**`,
                fields: notificationFields,
            }],
            'userReport'
        );

        await discord.roleHighlightWebhookPost('report');

        // for #nat
        await discord.webhookPost(
            [{
                thumbnail: {
                    url: `https://a.ppy.sh/${u.osuId}`,
                },
                color: discord.webhookColors.darkRed,
                description: `[${reportCategory}](http://bn.mappersguild.com/managereports?id=${report.id}) for **${u.username}**`,
                fields: notificationFields,
            }],
            'natUserReport'
        );

        Logger.generate(
            null,
            `Reported "${u.username}" for reason "${util.shorten(req.body.reason)}"`,
            'report',
            report._id
        );
    } else {
        if (!validUrl) {
            return res.json({
                error: 'Invalid link',
            });
        }

        await report.save();

        res.json({
            success: 'ok',
        });

        // for #user-reportfeed
        await discord.webhookPost([{
            description: `[${reportCategory}](http://bn.mappersguild.com/managereports?id=${report.id})`,
            color: discord.webhookColors.darkRed,
            fields: notificationFields,
        }],
        'userReport');

        await discord.roleHighlightWebhookPost('report');

        // for #nat
        await discord.webhookPost([{
            description: `[${reportCategory}](http://bn.mappersguild.com/managereports?id=${report.id})`,
            color: discord.webhookColors.darkRed,
            fields: notificationFields,
        }],
        'natUserReport');

        Logger.generate(
            null,
            'Reported something without a username included',
            'report',
            report._id
        );
    }
});

module.exports = router;
