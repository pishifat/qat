const express = require('express');
const api = require('../helpers/api');
const Report = require('../models/report');
const User = require('../models/user');
const Logger = require('../models/log');

const router = express.Router();

router.use(api.isLoggedIn);

/* GET reports page */
router.get('/', (req, res) => {
    res.render('reports', {
        title: 'Reports',
        script: '../js/reports.js',
        isReports: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat,
    });
});

/* POST submit or edit eval */
router.post('/submitReport/', api.isLoggedIn, async (req, res) => {
    if (!req.body.username && !req.body.username.length && !req.body.link && !req.body.link.length) {
        return res.json({ error: 'You must include a username or a link' });
    }

    if (req.body.username) {
        let u = await User.findByUsername(req.body.username);

        if (!u) {
            return res.json({ error: 'Cannot find user! Make sure you spelled it correctly' });
        }

        if (u.group == 'user') {
            return res.json({ error: 'User is not a member of the BN/NAT!' });
        }

        const r = await Report.create({
            reporter: req.session.mongoId,
            culprit: u.id,
            reason: req.body.reason,
            link: req.body.link,
        });

        res.json({});

        let fields = [{
            name: 'Report reason',
            value: req.body.reason.length > 975 ? req.body.reason.slice(0,975) + '... *(truncated)*' : req.body.reason,
        }];

        if (req.body.link && req.body.link.length) {
            fields.push({
                name: 'Relevant link',
                value: req.body.link,
            });
        }

        api.webhookPost([{
            thumbnail: {
                url: `https://a.ppy.sh/${u.osuId}`,
            },
            color: api.webhookColors.darkRed,
            description: `[User report](http://bn.mappersguild.com/managereports?report=${r.id}) for **${u.username}**`,
            fields,
        }]);
        Logger.generate(
            null,
            `Reported "${u.username}" for reason "${
                req.body.reason.length > 50 ? req.body.reason.slice(0, 50) + '...' : req.body.reason
            }"`
        );
    } else {
        const r = await Report.create({
            reporter: req.session.mongoId,
            reason: req.body.reason,
            link: req.body.link,
        });

        res.json({});

        api.webhookPost([{
            description: `[Non-user report](http://bn.mappersguild.com/managereports?report=${r.id})`,
            color: api.webhookColors.lightRed,
            fields: [
                {
                    name: 'Report reason',
                    value: req.body.reason.length > 975 ? req.body.reason.slice(0,975) + '... *(truncated)*' : req.body.reason,
                },
            ],
        }]);
        Logger.generate(
            null,
            'Reported something without a username included'
        );
    }

});

module.exports = router;
