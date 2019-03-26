const express = require('express');
const api = require('../models/api.js');
const reports = require('../models/report.js');
const users = require('../models/qatUser.js');

const router = express.Router();

router.use(api.isLoggedIn);

/* GET reports page */
router.get('/', async (req, res, next) => {
    res.render('reports', { 
        title: 'Report a BN/QAT', 
        script: '../js/reports.js', 
        isReports: true, 
        layout: 'qatlayout',
        isBnOrQat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'qat',
        isQat: res.locals.userRequest.group == 'qat'
    });
});


/* POST submit or edit eval */
router.post('/submitReport/', api.isLoggedIn, async (req, res) => {
    let u = await users.service.query({username: new RegExp('^' + req.body.username.trim() + '$', 'i')});
    if(!u){
        return res.json({ error: "Cannot find user! Make sure you spelled it correctly" })
    }
    await reports.service.create(req.session.qatUsername, req.session.qatOsuId, u.id, req.body.reason);
    res.json({});
});

module.exports = router;
