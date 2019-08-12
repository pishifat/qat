const express = require('express');
const api = require('../helpers/api');
const questionsService = require('../models/bnTest/question').service;
const optionsService = require('../models/bnTest/option').service;
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
        isBnOrNat: res.locals.userRequest.isBnOrNat,
        isNat: res.locals.userRequest.isNat,
    });
});

//population
const defaultPopulate = [
    { populate: 'options', display: 'content score metadataType active' },
];

/* GET applicant listing. */
router.get('/load/:type', async (req, res) => {
    let q = await questionsService.query({ category: req.params.type }, defaultPopulate, { createdAt: -1 }, true);
    res.json({ questions: q, isSpectator: res.locals.userRequest.isSpectator });
});

/* POST add question */
router.post('/addQuestion/', async (req, res) => {
    let q = await questionsService.create(req.body.category, req.body.newQuestion, req.body.questionType);
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
router.post('/updateQuestion/:id', async (req, res) => {
    let q = await questionsService.update(req.params.id, {
        content: req.body.newQuestion,
        questionType: req.body.questionType,
    });
    q = await questionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(q);
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
router.post('/toggleActive/:id', async (req, res) => {
    let q = await questionsService.update(req.params.id, { active: req.body.status });
    q = await questionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(q);
    logsService.create(
        req.session.mongoId,
        `Marked RC test question as "${req.body.status ? 'active' : 'inactive'}"`
    );
});

/* POST add option */
router.post('/addOption/:id', async (req, res) => {
    let o = await optionsService.create(req.body.option, req.body.score);
    if (!o || o.error) {
        return res.json({ error: 'Something went wrong!' });
    }
    if (req.body.metadataType) {
        o = await optionsService.update(o.id, { metadataType: req.body.metadataType });
    }

    let q = await questionsService.update(req.params.id, { $push: { options: o.id } });
    q = await questionsService.query({ _id: req.params.id }, defaultPopulate);
    res.json(q);
    logsService.create(
        req.session.mongoId,
        `Added option for RC test question: "${
            req.body.option.length > 50 ? req.body.option.slice(0, 50) + '...' : req.body.option
        }"`
    );
});

/* POST edit option */
router.post('/updateOption/:id', async (req, res) => {
    let o = await optionsService.update(req.params.id, { content: req.body.option, score: req.body.score });
    if (!o) {
        return res.json({ error: 'Something went wrong!' });
    }
    if (req.body.metadataType) {
        o = await optionsService.update(o.id, { metadataType: req.body.metadataType });
    }
    let q = await questionsService.query({ _id: req.body.questionId }, defaultPopulate);
    res.json(q);
    logsService.create(
        req.session.mongoId,
        `Updated option for RC test question: "${
            req.body.option.length > 50 ? req.body.option.slice(0, 50) + '...' : req.body.option
        }"`
    );
});

/* POST edit option activity */
router.post('/toggleActiveOption/', async (req, res) => {
    for (let i = 0; i < req.body.checkedOptions.length; i++) {
        let o = await optionsService.query({ _id: req.body.checkedOptions[i] });
        await optionsService.update(req.body.checkedOptions[i], { active: !o.active });
    }
    let q = await questionsService.query({ _id: req.body.questionId }, defaultPopulate);
    res.json(q);
    logsService.create(
        req.session.mongoId,
        `Changed active status of ${req.body.checkedOptions.length} RC test question option${
            req.body.checkedOptions.length == 1 ? '' : 's'
        }`
    );
});

module.exports = router;
