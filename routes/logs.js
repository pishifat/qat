const express = require('express');
const api = require('../models/api');
const logsService = require('../models/log').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

const defaultPopulate = [{ populate: 'user', display: 'username' }];

/* GET logs */
router.get('/', async (req, res, next) => {
    res.render('logs', {
        title: 'Logs',
        script: '../js/logs.js',
        isLogs: true,
        logs: await logsService.query(
            {},
            defaultPopulate,
            { createdAt: -1 },
            true,
            100
        ),
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
    });
});

router.get('/more/:skip', async (req, res, next) => {
    res.json(
        await logsService.query({}, defaultPopulate, { createdAt: -1 }, true, 100, parseInt(req.params.skip))
    );
});

module.exports = router;
