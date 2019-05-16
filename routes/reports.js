const express = require('express');
const api = require('../models/api.js');
const helper = require('./helper');
const reportsService = require('../models/report').service;
const usersService = require('../models/user').service;
const logsService = require('../models/log').service;

const router = express.Router();

router.use(api.isLoggedIn);

/* GET reports page */
router.get('/', async (req, res, next) => {
    res.render('reports', {
        title: 'Reports',
        script: '../js/reports.js',
        isReports: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

/* POST submit or edit eval */
router.post('/submitReport/', api.isLoggedIn, async (req, res) => {
    if(!req.body.username && !req.body.username.length && !req.body.link && !req.body.link.length){
        return res.json({ error: 'You must include a username or a link' });
    }
    if(req.body.username){
        let u = await usersService.query({ username: new RegExp('^' + helper.escapeUsername(req.body.username) + '$', 'i') });
        if (!u) {
            return res.json({ error: 'Cannot find user! Make sure you spelled it correctly' });
        }
        if (u.group == 'user') {
            return res.json({ error: 'User is not a member of the BN/NAT!' });
        }
        await reportsService.create(req.session.mongoId, u.id, req.body.reason, req.body.link);
        res.json({});
        if(u.group != 'nat'){
            api.webhookPost([{
                author: {
                    name: `User report: ${u.username}`,
                    icon_url: `https://a.ppy.sh/${u.osuId}`,
                    url: `https://osu.ppy.sh/users/${u.osuId}`
                },
                color: '12184229',
                fields:[
                    {
                        name: `Report reason`,
                        value: req.body.reason
                    }
                ]
            }]);
            logsService.create(
                null,
                `Reported "${u.username}" for reason "${
                    req.body.reason.length > 50 ? req.body.reason.slice(0, 50) + '...' : req.body.reason
                }"`
            );
        }
    }else{
        await reportsService.create(req.session.mongoId, null, req.body.reason, req.body.link);
        res.json({});
        api.webhookPost([{
            author: {
                name: `Non-user report`,
                url: req.body.link
            },
            color: '15386534',
            fields:[
                {
                    name: `Report reason`,
                    value: req.body.reason
                }
            ]
        }]);
        logsService.create(
            null,
            `Reported something without a username included`
        );
    }
    
});

module.exports = router;
