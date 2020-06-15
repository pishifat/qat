const express = require('express');
const Question = require('../models/bnTest/question');
const Option = require('../models/bnTest/option');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isNat);

//population
const defaultPopulate = [
    {
        path: 'options',
        select: 'content score active',
        sort: {
            active: 1,
        },
    },
];

/* GET applicant listing. */
router.get('/load/:type', async (req, res) => {
    let questions = await Question
        .find({ category: req.params.type })
        .populate(defaultPopulate)
        .sort({
            createdAt: -1,
        });

    res.json({ questions });
});

/* POST add question */
router.post('/store', middlewares.isNotSpectator, async (req, res) => {
    let q = await Question.create({
        category: req.body.category,
        content: req.body.newQuestion,
        questionType: req.body.questionType,
    });

    res.json(q);
    Logger.generate(
        req.session.mongoId,
        `Added new "${req.body.category}" question to RC test: "${
            req.body.newQuestion.length > 50
                ? req.body.newQuestion.slice(0, 50) + '...'
                : req.body.newQuestion
        }"`
    );
});

/* POST edit question */
router.post('/:id/update', middlewares.isNotSpectator, async (req, res) => {
    const question = await Question
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    question.content = req.body.newQuestion;
    question.questionType = req.body.questionType;
    await question.save();

    res.json(question);
    Logger.generate(
        req.session.mongoId,
        `Updated question on RC test: "${
            req.body.newQuestion.length > 50
                ? req.body.newQuestion.slice(0, 50) + '...'
                : req.body.newQuestion
        }"`
    );
});

/* POST edit activity of question */
router.post('/:id/toggleActivity', middlewares.isNotSpectator, async (req, res) => {
    const question = await Question
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    question.active = !question.active;
    await question.save();

    res.json(question);
    Logger.generate(
        req.session.mongoId,
        `Marked RC test question as "${req.body.status ? 'active' : 'inactive'}"`
    );
});

function validateInput (contentInput, scoreInput) {
    const content = contentInput;
    const score = parseFloat(scoreInput);

    if (!content || isNaN(score)) {
        throw new Error('Cannot leave option fields blank');
    }

    return [content, score];
}

/* POST add option */
router.post('/:id/options/store', middlewares.isNotSpectator, async (req, res) => {
    const [content, score] = validateInput(req.body.content, req.body.score);
    let option = await Option.create({
        content,
        score,
    });

    if (!option) {
        return res.json({ error: 'Something went wrong!' });
    }

    let question = await Question
        .findByIdAndUpdate(req.params.id, { $push: { options: option.id } })
        .populate(defaultPopulate)
        .orFail();

    res.json(question);
    Logger.generate(
        req.session.mongoId,
        `Added option for RC test question: "${
            content.length > 50 ? content.slice(0, 50) + '...' : content
        }"`
    );
});

/* POST edit option */
router.post('/:id/options/:optionId/update', middlewares.isNotSpectator, async (req, res) => {
    const [content, score] = validateInput(req.body.content, req.body.score);
    let option = await Option.findById(req.params.optionId).orFail();
    option.content = content;
    option.score = score;
    await option.save();

    if (!option) {
        return res.json({ error: 'Something went wrong!' });
    }

    let question = await Question
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    res.json(question);
    Logger.generate(
        req.session.mongoId,
        `Updated option for RC test question: "${
            content.length > 50 ? content.slice(0, 50) + '...' : content
        }"`
    );
});

/* POST edit option activity */
router.post('/:id/options/:optionId/toggleActivity', middlewares.isNotSpectator, async (req, res) => {
    let option = await Option.findById(req.params.optionId).orFail();
    option.active = !option.active;
    await option.save();

    let question = await Question
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    res.json(question);
    Logger.generate(
        req.session.mongoId,
        `Changed active status of a RC test question option`
    );
});

module.exports = router;
