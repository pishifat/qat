const express = require('express');
const Report = require('../models/report');
const Discussion = require('../models/discussion');
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
    report.reason = req.body.reason;

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
            success: 'ok',
        });

        // for #user-reportfeed
        await discord.webhookPost(
            [{
                thumbnail: {
                    url: `https://a.ppy.sh/${u.osuId}`,
                },
                color: discord.webhookColors.darkRed,
                description: `[User report](http://bn.mappersguild.com/managereports?id=${report.id}) for **${u.username}**`,
                fields: notificationFields,
            }],
            'userReport'
        );

        // for #nat
        await discord.webhookPost(
            [{
                thumbnail: {
                    url: `https://a.ppy.sh/${u.osuId}`,
                },
                color: discord.webhookColors.darkRed,
                description: `[User report](http://bn.mappersguild.com/managereports?id=${report.id}) for **${u.username}**`,
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
            description: `[Non-user report](http://bn.mappersguild.com/managereports?id=${report.id})`,
            color: discord.webhookColors.lightRed,
            fields: notificationFields,
        }],
        'userReport');

        // for #nat
        await discord.webhookPost([{
            description: `[Non-user report](http://bn.mappersguild.com/managereports?id=${report.id})`,
            color: discord.webhookColors.lightRed,
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

/* POST submit content case (Discussion) */
router.post('/submitContentCase/', middlewares.isLoggedIn, async (req, res) => {
    const url = req.body.link;

    if (url.length == 0) {
        return res.json({
            error: 'No link provided',
        });
    }

    const contentReviews = await Discussion.find({ isContentReview: true });
    const title = `Content review #${contentReviews.length + 251}`;
    let shortReason = `Is this content appropriate for a beatmap? ${url}`;

    if (req.body.reason.length) {
        shortReason += `\n\n*${req.body.reason}*`;
    }

    let d = await Discussion.create({
        discussionLink: url,
        title,
        shortReason,
        mode: 'all',
        creator: req.session.mongoId,
        isNatOnly: false,
        neutralAllowed: false,
        reasonAllowed: true,
        isContentReview: true,
    });

    res.json({
        success: 'ok',
    });

    Logger.generate(
        req.session.mongoId,
        'Submitted a discussion for voting',
        'discussionVote',
        d._id
    );

    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.yellow,
            description: `**New discussion up for vote:** [${title}](http://bn.mappersguild.com/discussionvote?id=${d.id})`,
            fields: [
                {
                    name: `Question/Proposal`,
                    value: shortReason,
                },
            ],
        }],
        'contentCase'
    );

    await discord.roleHighlightWebhookPost('contentCase');
});

module.exports = router;
