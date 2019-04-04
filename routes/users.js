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
        { createdAt: 1 },
        true
    );
    res.json({ users: u, userId: req.session.mongoId, userGroup: res.locals.userRequest.group });
});

/* POST submit or edit eval */
router.post('/switchMediator/', api.isLoggedIn, async (req, res) => {
    let u = await usersService.update(req.session.mongoId, {
        vetoMediator: !res.locals.userRequest.vetoMediator,
    });
    res.json(u);
    logsService.create(req.session.mongoId, `Opted ${u.vetoMediator ? 'in to' : 'out of'}  veto mediation`);
});

/* POST switch usergroup */
router.post('/switchGroup/:id', api.isLoggedIn, async (req, res) => {
    let u = await usersService.update(req.params.id, { group: req.body.group });
    u = await usersService.update(req.params.id, { probation: [] });
    res.json(u);
    logsService.create(
        req.session.mongoId,
        `Changed usergroup of "${u.username}" to "${req.body.group.toUpperCase()}"`
    );
});

/* POST switch usergroup */
router.post('/tempCreate/', api.isLoggedIn, async (req, res) => {
    let u = await usersService.create(req.body.osuId, req.body.username, req.body.group);
    await usersService.update(u.id, { $push: { modes: req.body.mode } });
    if (req.body.probation.length) {
        await usersService.update(u.id, { $push: { probation: req.body.probation } });
    }
    res.json(u);
});

/* POST switch usergroup */
router.post('/tempUpdate/', api.isLoggedIn, async (req, res) => {
    const u = await usersService.query({ username: new RegExp('^' + helper.escapeUsername(req.body.username) + '$', 'i') });
    if (req.body.mode.length) {
        await usersService.update(u.id, { $push: { modes: req.body.mode } });
    }
    if (req.body.probation.length) {
        await usersService.update(u.id, { $push: { probation: req.body.probation } });
    }
    if (req.body.date) {
        if (req.body.group == 'bn') await usersService.update(u.id, { $push: { bnDuration: req.body.date } });
        if (req.body.group == 'nat')
            await usersService.update(u.id, { $push: { natDuration: req.body.date } });
    }
    res.json(u);
});

module.exports = router;
