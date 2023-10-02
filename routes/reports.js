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

    const blockedUrls = [
        'ppy.sh',
        'puu.sh',
    ];

    if (req.body.category == 'contentCaseVisual' && blockedUrls.some(url => link.includes(url))) {
        return res.json({
            error: 'images hosted on this website are not allowed, as they can change/disappear quickly. please use a different image hosting service instead.',
        });
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
            success: 'Sent!',
        });

        const populatedReport = await Report.findById(report.id);

        // #bnsite-reports (internal)
        await discord.webhookPost(
            [{
                thumbnail: {
                    url: `https://a.ppy.sh/${u.osuId}`,
                },
                color: discord.webhookColors.darkRed,
                description: `New [${populatedReport.reportCategory}](http://bn.mappersguild.com/managereports?id=${populatedReport.id}) for **${u.username}**`,
                fields: notificationFields,
            }],
            'natUserReport'
        );
        
        await discord.roleHighlightWebhookPost('natUserReport', ['natInternal']);

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
            success: 'Sent!',
        });

        const populatedReport = await Report.findById(report.id);

        // #bnsite-reports (internal)

        await discord.webhookPost([{
            description: `New [${populatedReport.reportCategory}](http://bn.mappersguild.com/managereports?id=${report.id})`,
            color: discord.webhookColors.darkRed,
            fields: notificationFields,
        }],
        'natUserReport');

        if (report.category == 'other') {
            await discord.roleHighlightWebhookPost('natUserReport', ['natInternal']);
        }

        Logger.generate(
            null,
            'Reported something without a username included',
            'report',
            report._id
        );
    }
});

module.exports = router;
