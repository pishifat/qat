const express = require('express');
const helper = require('./helper');
const api = require('../models/api');
const usersService = require('../models/user').service;
const logsService = require('../models/log').service;

const router = express.Router();

router.use(api.isLoggedIn);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('users', {
        title: 'BN/NAT Listing',
        script: '../javascripts/users.js',
        isUsers: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat',
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    let u = await usersService.query(
        { $or: [{ group: 'nat' }, { group: 'bn' }] },
        {},
        { username: 1 },
        true
    );
    res.json({ users: u, userId: req.session.mongoId, isLeader: res.locals.userRequest.isLeader });
});

/* POST submit or edit eval */
router.post('/switchMediator/', api.isBnOrNat, async (req, res) => {
    let u = await usersService.update(req.session.mongoId, {
        vetoMediator: !res.locals.userRequest.vetoMediator,
    });
    res.json(u);
    logsService.create(req.session.mongoId, `Opted ${u.vetoMediator ? 'in to' : 'out of'}  veto mediation`);
});

/* POST switch usergroup */
router.post('/switchGroup/:id', api.isNat, async (req, res) => {
    let u = await usersService.update(req.params.id, { group: req.body.group,  probation: [], $push: {bnDuration: new Date(), natDuration: new Date()} });
    res.json(u);
    logsService.create(
        req.session.mongoId,
        `Changed usergroup of "${u.username}" to "${req.body.group.toUpperCase()}"`
    );
});

module.exports = router;
