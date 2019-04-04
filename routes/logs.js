var express = require('express');
var logs = require('../models/log.js');
var users = require('../models/user.js');
var api = require('../models/api.js');

var router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

const defaultPopulate = [
    { populate: 'user', display: 'username', model: users.User },
];

/* GET logs */
router.get('/', async (req, res, next) => {
    res.render('logs', {
        title: 'Logs',
        script: '../js/logs.js',
        isLogs: true,
        logs: await logs.service.query(
            { user: req.session.mongoId },
            defaultPopulate,
            { createdAt: -1 },
            true,
            100
        ),
        isBnOrNat:
            res.locals.userRequest.group == 'bn' ||
            res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat',
    });
});

router.get('/more/:skip', async (req, res, next) => {
    res.json(
        await logs.service.query(
            {},
            defaultPopulate,
            { createdAt: -1 },
            true,
            100,
            parseInt(req.params.skip)
        )
    );
});

module.exports = router;
