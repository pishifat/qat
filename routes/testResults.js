const express = require('express');
const TestSubmission = require('../models/bnTest/testSubmission');
const User = require('../models/user');
const AppEvaluation = require('../models/evaluations/appEvaluation');
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
    const userToSearch = decodeURI(req.params.user);
    const user = await User
        .findByUsernameOrOsuId(userToSearch)
        .orFail();

    const tests = await TestSubmission
        .find({
            applicant: user.id,
            status: 'finished',
        })
        .populate(defaultTestPopulate)
        .sort({ createdAt: -1 })
        .orFail(new Error('No tests saved for that user!'));

    res.json({
        tests,
    });
});

/* GET search for test */
router.get('/findApplication/:id', middlewares.isNat, async (req, res) => {
    res.json(await AppEvaluation.findOne({ test: req.params.id }));
});

module.exports = router;
