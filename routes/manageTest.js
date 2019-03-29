const express = require('express');
const api = require('../models/api.js');
const questions = require('../models/question.js');
const options = require('../models/option.js');
const users = require('../models/user.js');

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('managetest', { 
        title: 'Manage RC Test', 
        script: '../javascripts/manageTest.js', 
        isManageTest: true, 
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat' });
});

//population
const defaultPopulate = [
    { populate: 'options', display: 'content score metadataType', model: options.Option },

];

/* GET applicant listing. */
router.get('/load/:type', async (req, res, next) => {
    let q = await questions.service.query({category: req.params.type}, defaultPopulate, {}, true);
    res.json(q);
});


/* POST add question */
router.post('/addQuestion/', async (req, res) => {
    let q = await questions.service.create(req.body.category, req.body.newQuestion, req.body.questionType);
    res.json(q);
});

/* POST edit question */
router.post('/updateQuestion/:id', async (req, res) => {
    let q = await questions.service.update(req.params.id, {content: req.body.newQuestion, questionType: req.body.questionType});
    q = await questions.service.query({_id: req.params.id}, defaultPopulate);
    res.json(q);
});

/* POST edit activity of question */
router.post('/toggleActive/:id', async (req, res) => {
    let q = await questions.service.update(req.params.id, {active: req.body.status});
    q = await questions.service.query({_id: req.params.id}, defaultPopulate);
    res.json(q);
});

/* POST add option */
router.post('/addOption/:id', async (req, res) => {
    let o = await options.service.create(req.body.option, req.body.score);
    if(!o){
        return res.json({error: 'Something went wrong!'});
    }
    if(req.body.metadataType) {
        o = await options.service.update(o.id, {metadataType: req.body.metadataType});
    }
    let q = await questions.service.update(req.params.id, {$push: {options: o.id}});
    q = await questions.service.query({_id: req.params.id}, defaultPopulate);
    res.json(q);
});

/* POST edit option */
router.post('/updateOption/:id', async (req, res) => {
    let o = await options.service.update(req.params.id, {content: req.body.option, score: req.body.score});
    if(!o){
        return res.json({error: 'Something went wrong!'});
    }
    if(req.body.metadataType) {
        o = await options.service.update(o.id, {metadataType: req.body.metadataType});
    }
    let q = await questions.service.query({_id: req.body.questionId}, defaultPopulate);
    res.json(q);
});

/* POST delete option */
router.post('/deleteOption/', async (req, res) => {
    for (let i = 0; i < req.body.checkedOptions.length; i++) {
        await options.service.remove(req.body.checkedOptions[i]);
    }
    let q = await questions.service.query({_id: req.body.questionId}, defaultPopulate);
    res.json(q);
});

/* POST delete question */
router.post('/deleteQuestion/:id', async (req, res) => {
    let q = await questions.service.query({_id: req.params.id});
    for (let i = 0; i < q.options.length; i++) {
        await options.service.remove(q.options[i]);
    }
    await questions.service.remove(req.params.id);
    res.json(true);
});

/* POST toggle active question */
router.post('/toggleActive/:id', async (req, res) => {
    let q = await questions.service.query({_id: req.params.id});
    for (let i = 0; i < q.options.length; i++) {
        await options.service.remove(q.options[i]);
    }
    res.json(true);
});

module.exports = router;
