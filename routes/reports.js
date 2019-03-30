const express = require('express');
const api = require('../models/api.js');
const reports = require('../models/report.js');
const users = require('../models/user.js');
const logs = require('../models/log.js');

const router = express.Router();

router.use(api.isLoggedIn);

/* GET reports page */
router.get('/', async (req, res, next) => {
    res.render('reports', { 
        title: 'Report a BN/NAT', 
        script: '../js/reports.js', 
        isReports: true, 
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat'
    });
});


/* POST submit or edit eval */
router.post('/submitReport/', api.isLoggedIn, async (req, res) => {
    let u = await users.service.query({username: new RegExp('^' + req.body.username.trim() + '$', 'i')});
    if(!u){
        return res.json({ error: "Cannot find user! Make sure you spelled it correctly" })
    }
    await reports.service.create(req.session.mongoId, u.id, req.body.reason);
    res.json({});
    let anon = await users.service.query({username: 'pishifat'});
    logs.service.create(anon.id, 
        `Reported "${u.username}" for reason "${req.body.reason.length > 50 ? req.body.reason.slice(0, 50) + '...' : req.body.reason}"`);
});

module.exports = router;
