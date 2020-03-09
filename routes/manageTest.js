const express = require('express');
const api = require('../helpers/api');
const Question = require('../models/bnTest/question');
const Option = require('../models/bnTest/option');
const logsService = require('../models/log').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('rcTest/managetest', {
        title: 'Manage RC Test',
        script: '../javascripts/manageTest.js',
        isTest: true,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

//population
const defaultPopulate = [
    { path: 'options', select: 'content score active' },
];

/* GET applicant listing. */
router.get('/load/:type', async (req, res) => {
    let questions = await Question
        .find({ category: req.params.type })
        .populate(defaultPopulate)
        .sort({ createdAt: -1 });

    res.json({ questions });
});

/* POST add question */
router.post('/addQuestion/', api.isNotSpectator, async (req, res) => {
    let q = await Question.create({
        category: req.body.category,
        content: req.body.newQuestion,
        questionType: req.body.questionType,
    });

    res.json(q);
    logsService.create(
        req.session.mongoId,
        `Added new "${req.body.category}" question to RC test: "${
            req.body.newQuestion.length > 50
                ? req.body.newQuestion.slice(0, 50) + '...'
                : req.body.newQuestion
        }"`
    );
});

/* POST edit question */
router.post('/updateQuestion/:id', api.isNotSpectator, async (req, res) => {
    let question = await Question
        .findByIdAndUpdate(req.params.id, {
            content: req.body.newQuestion,
            questionType: req.body.questionType,
        })
        .populate(defaultPopulate);

    res.json(question);
    logsService.create(
        req.session.mongoId,
        `Updated question on RC test: "${
            req.body.newQuestion.length > 50
                ? req.body.newQuestion.slice(0, 50) + '...'
                : req.body.newQuestion
        }"`
    );
});

/* POST edit activity of question */
router.post('/toggleActive/:id', api.isNotSpectator, async (req, res) => {
    let question = await Question
        .findByIdAndUpdate(req.params.id, { active: req.body.status })
        .populate(defaultPopulate);

    res.json(question);
    logsService.create(
        req.session.mongoId,
        `Marked RC test question as "${req.body.status ? 'active' : 'inactive'}"`
    );
});

/* POST add option */
router.post('/addOption/:id', api.isNotSpectator, async (req, res) => {
    let o = await Option.create({
        content: req.body.option,
        score: req.body.score,
    });

    if (!o || o.error) {
        return res.json({ error: 'Something went wrong!' });
    }

    let q = await Question
        .findByIdAndUpdate(req.params.id, { $push: { options: o.id } })
        .populate(defaultPopulate);

    res.json(q);
    logsService.create(
        req.session.mongoId,
        `Added option for RC test question: "${
            req.body.option.length > 50 ? req.body.option.slice(0, 50) + '...' : req.body.option
        }"`
    );
});

/* POST edit option */
router.post('/updateOption/:id', api.isNotSpectator, async (req, res) => {
    let o = await Option.findByIdAndUpdate(req.params.id, {
        content: req.body.option,
        score: req.body.score,
    });

    if (!o) {
        return res.json({ error: 'Something went wrong!' });
    }

    let q = await Question
        .findById(req.body.questionId)
        .populate(defaultPopulate);

    res.json(q);
    logsService.create(
        req.session.mongoId,
        `Updated option for RC test question: "${
            req.body.option.length > 50 ? req.body.option.slice(0, 50) + '...' : req.body.option
        }"`
    );
});

/* POST edit option activity */
router.post('/toggleActiveOption/', api.isNotSpectator, async (req, res) => {
    for (let i = 0; i < req.body.checkedOptions.length; i++) {
        let o = await Option.findById(req.body.checkedOptions[i]);
        o.active = !o.active;
        await o.save();
    }

    let q = await Question
        .findById(req.body.questionId)
        .populate(defaultPopulate);

    res.json(q);
    logsService.create(
        req.session.mongoId,
        `Changed active status of ${req.body.checkedOptions.length} RC test question option${
            req.body.checkedOptions.length == 1 ? '' : 's'
        }`
    );
});

module.exports = router;
