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
            { isError: { $ne: true } },
            defaultPopulate,
            { createdAt: -1 },
            true,
            100
        ),
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isAdmin: req.session.osuId == 1052994 || req.session.osuId == 3178418,
    });
});

router.get('/more/:skip', async (req, res, next) => {
    res.json(
        await logsService.query({}, defaultPopulate, { createdAt: -1 }, true, 100, parseInt(req.params.skip))
    );
});

router.get('/showErrors', async (req, res, next) => {
    if (req.session.osuId == 1052994 || req.session.osuId == 3178418) {
        res.json(
            await logsService.query({ isError: true }, defaultPopulate, { createdAt: -1 }, true, 100, parseInt(req.params.skip))
        );
    } else {
        res.redirect('/');
    }
});

module.exports = router;
