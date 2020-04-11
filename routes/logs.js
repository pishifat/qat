const express = require('express');
const api = require('../helpers/api');
const Logger = require('../models/log');

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

const defaultPopulate = [{ path: 'user', select: 'username' }];

/* GET logs */
router.get('/', async (req, res) => {
    res.render('logs', {
        title: 'Logs',
        script: '../js/logs.js',
        isLogs: true,
        logs: await Logger
            .find({ isError: { $ne: true } })
            .populate(defaultPopulate)
            .sort({ createdAt: -1 })
            .limit(100),
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
        isAdmin: req.session.osuId == 1052994 || req.session.osuId == 3178418,
    });
});

router.get('/more/:skip', async (req, res) => {
    res.json(
        await Logger
            .find({})
            .populate(defaultPopulate)
            .sort({ createdAt: -1 })
            .limit(100)
            .skip(parseInt(req.params.skip))
    );
});

router.get('/showErrors', async (req, res) => {
    if (req.session.osuId == 1052994 || req.session.osuId == 3178418) {
        res.json(
            await Logger
                .find({ isError: true })
                .populate(defaultPopulate)
                .sort({ createdAt: -1 })
                .limit(100)
                .skip(parseInt(req.params.skip))
        );
    } else {
        res.redirect('/');
    }
});

module.exports = router;
