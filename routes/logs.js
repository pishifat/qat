const express = require('express');
const Logger = require('../models/log');
const User = require('../models/user');
const middlewares = require('../helpers/middlewares');
const { escapeRegex } = require('../helpers/util');

const router = express.Router();

router.use(middlewares.isLoggedIn);

const defaultPopulate = [{ path: 'user', select: 'username' }];

async function queryLogs(find, skip, userQuery, actionQuery) {
    if (userQuery) {
        const user = await User.findByUsernameOrOsuId(decodeURI(userQuery));

        if (!user) {
            return { error: 'Cannot find user!' };
        }

        find.user = user.id;
    }

    if (actionQuery && actionQuery.trim()) {
        find.action = { $regex: escapeRegex(actionQuery.trim()), $options: 'i' };
    }

    return Logger
        .find(find)
        .select('user action category relatedId createdAt stack extraInfo')
        .populate(defaultPopulate)
        .sort({ createdAt: -1 })
        .limit(300)
        .skip(parseInt(skip) || 0);
}

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

    res.json(await queryLogs(find, req.params.skip, req.query.user, req.query.action));
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

    res.json(await queryLogs({ category, isError: false }, req.params.skip, req.query.user, req.query.action));
});

module.exports = router;
