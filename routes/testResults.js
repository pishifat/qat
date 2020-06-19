const express = require('express');
const TestSubmission = require('../models/bnTest/testSubmission');
const User = require('../models/user');
const middlewares = require('../helpers/middlewares');

const router = express.Router();

router.use(middlewares.isLoggedIn);

const defaultTestPopulate = [
    { path: 'applicant', select: 'username osuId' },
    { path: 'answers', select: 'question optionsChosen' },
    {
        path: 'answers',
        populate: {
            path: 'question',
            populate: {
                path: 'options',
            },
        },
    },
];

/* GET relevant info. */
router.get('/relevantInfo', async (req, res) => {
    let tests = await TestSubmission
        .find({
            applicant: req.session.mongoId,
            status: 'finished',
        })
        .populate(defaultTestPopulate);

    res.json({
        tests,
    });
});


/* GET search for test */
router.get('/search/:user', middlewares.isNat, async (req, res) => {
    let user;
    const userToSearch = decodeURI(req.params.user);

    if (isNaN(userToSearch)) {
        user = await User.findByUsername(userToSearch);
    } else {
        user = await User.findOne({ osuId: parseInt(userToSearch) });
    }

    if (!user) {
        return res.json({
            error: 'Cannot find user!',
        });
    }

    const tests = await TestSubmission
        .find({
            applicant: user.id,
            status: 'finished',
        })
        .populate(defaultTestPopulate)
        .sort({ createdAt: -1 });

    if (!tests.length) {
        return res.json({
            error: 'No tests saved for that user!',
        });
    }

    res.json({
        tests,
    });
});

module.exports = router;
