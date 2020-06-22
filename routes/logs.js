const express = require('express');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccess);

const defaultPopulate = [{ path: 'user', select: 'username' }];

router.get('/search', async (req, res) => {
    res.json({
        logs: await Logger
            .find({})
            .populate(defaultPopulate)
            .sort({ createdAt: -1 })
            .limit(100)
            .skip(parseInt(req.query.skip) || 0),
    });
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
