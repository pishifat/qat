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
        title: 'Report a BN/NAT',
        script: '../js/reports.js',
        isReports: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isBnEvaluator: res.locals.userRequest.group == 'bn' && res.locals.userRequest.isBnEvaluator && !res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

/* POST submit or edit eval */
router.post('/submitReport/', api.isLoggedIn, async (req, res) => {
    let u = await usersService.query({ username: new RegExp('^' + helper.escapeUsername(req.body.username) + '$', 'i') });
    if (!u) {
        return res.json({ error: 'Cannot find user! Make sure you spelled it correctly' });
    }
    if (u.group == 'user') {
        return res.json({ error: 'User is not a member of the BN/NAT!' });
    }
    await reportsService.create(req.session.mongoId, u.id, req.body.reason);
    res.json({});
    logsService.create(
        null,
        `Reported "${u.username}" for reason "${
            req.body.reason.length > 50 ? req.body.reason.slice(0, 50) + '...' : req.body.reason
        }"`
    );
});

module.exports = router;
