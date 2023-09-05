const express = require('express');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');

const router = express.Router();

router.use(middlewares.isLoggedIn);

const defaultPopulate = [{ path: 'user', select: 'username' }];

/* GET logs */
router.get('/search/:category/:skip', middlewares.isNat, async (req, res) => {
    const category = req.params.category;

    let find;

    if (category == 'error') {
        find = { isError: true };
    } else if (category !== 'all') {
        find = { category };
    } else {
        find = { isError: false, category: { $ne: 'interOp' } };
    }

    res.json(
        await Logger
            .find(find)
            .select('user action category relatedId createdAt stack extraInfo')
            .populate(defaultPopulate)
            .sort({ createdAt: -1 })
            .limit(300)
            .skip(parseInt(req.params.skip) || 0)
    );
});

/* GET public logs */
router.get('/public/:category/:skip', async (req, res) => {
    const category = req.params.category;
    const allowedCategories = ['notableNameChanges'];

    if (!allowedCategories.includes(category)) {
        return res.json({
            error: 'Invalid category',
        });
    }

    res.json(
        await Logger
            .find({ category, isError: false })
            .select('user action category relatedId createdAt stack extraInfo')
            .populate(defaultPopulate)
            .sort({ createdAt: -1 })
            .limit(300)
            .skip(parseInt(req.params.skip) || 0)
    );
});

module.exports = router;
