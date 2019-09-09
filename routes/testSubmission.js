const express = require('express');
const api = require('../helpers/api');
const testSubmissionService = require('../models/bnTest/testSubmission').service;
const logsService = require('../models/log').service;
const bnAppsService = require('../models/bnApp').service;
const usersModel = require('../models/user').User;

const router = express.Router();
router.use(api.isLoggedIn);

const defaultPopulate = [
    { populate: 'applicant', display: 'username' },
    { populate: 'answers', display: 'question optionsChosen' },
    {
        innerPopulate: 'answers',
        populate: {
            path: 'question',
            populate: {
                path: 'options',
            },
        },
    },
    {
        innerPopulate: 'answers',
        populate: {
            path: 'metadataInput',
        },
    },
];

/* GET test page */
router.get('/', (req, res) => {
    res.render('testsubmission', {
        title: 'Test Submission',
        script: '../javascripts/testSubmission.js',
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

/* GET pending tests by user */
router.get('/tests', async (req, res) => {
    const tests = await testSubmissionService.query(
        {
            applicant: req.session.mongoId,
            status: { $ne: 'finished' },
        },
        null,
        null,
        true
    );

    if (!tests || !tests.length || tests.error) {
        return res.redirect('/');
    }

    return res.json({ testList: tests });
});

/* POST test by user */
router.post('/loadTest', async (req, res) => {
    let test = await testSubmissionService.query(
        {
            _id: req.body.testId,
            applicant: req.session.mongoId,
            status: { $ne: 'finished' },
        },
        defaultPopulate,
        { 'answers.question.category': 1 }
    );

    if (!test || test.error) {
        return res.redirect('/');
    }

    if (!test.startedAt) {
        await testSubmissionService.update(req.body.testId, { startedAt: Date.now(), status: 'wip' });
        test.startedAt = Date.now();
    }

    return res.json(test);
});

/* POST submit answers */
router.post('/submitAnswer', async (req, res) => {
    if (!req.body.answerId || !req.body.checkedOptions) return res.json({ error: 'Something went wrong!' });

    let answer;
    if (req.body.isMetadata) {
        const metadataInput = await testSubmissionService.createMetadataInput(
            req.body.answerId,
            req.body.checkedOptions.title || '',
            req.body.checkedOptions.titleUnicode || '',
            req.body.checkedOptions.artist || '',
            req.body.checkedOptions.artistUnicode || '',
            req.body.checkedOptions.source || '',
            req.body.checkedOptions.reference1 || '',
            req.body.checkedOptions.reference2 || '',
            req.body.checkedOptions.reference3 || ''
        );
        answer = await testSubmissionService.updateAnswer(req.body.answerId, { metadataInput });
    } else {
        answer = await testSubmissionService.updateAnswer(req.body.answerId, { optionsChosen: req.body.checkedOptions });
    }

    if (!answer || answer.error) return res.json({ error: 'Something went wrong!' });
    else return res.json({ success: 'ok' });
});

/* POST submit test */
router.post('/submitTest', async (req, res) => {
    const test = await testSubmissionService.query(
        {
            _id: req.body.testId,
            applicant: req.session.mongoId,
            status: { $ne: 'finished' },
        },
        defaultPopulate
    );
    const currentBnApp = await bnAppsService.query({
        applicant: req.session.mongoId,
        mode: test.mode,
        active: true, 
    });

    if (!test || test.error || !currentBnApp || currentBnApp.error) return res.json({ error: 'Something went wrong!' });
    let displayScore = 0;

    for (const answer of test.answers) {
        let questionScore = 0;
        let isReferenceAdded = false;

        for (const option of answer.question.options) {
            if (answer.question.category == 'metadata' && answer.metadataInput) {
                for (const [k, v] of Object.entries(answer.metadataInput.toObject())) {
                    // .slice because reference == reference1
                    if ((option.metadataType == k || (option.metadataType == k.slice(0, -1) && !isReferenceAdded)) && option.content == v) {
                        if (answer.optionsChosen.indexOf(option.id) == -1) {
                            const updatedAnswer = await testSubmissionService.updateAnswer(answer.id, {
                                $push: { optionsChosen: option.id },
                            });
                            if (!updatedAnswer || updatedAnswer.error) return res.json({ error: 'Something went wrong!' });
                        }

                        displayScore += option.score;
                        if (option.metadataType == 'reference') isReferenceAdded = true;
                    }
                }
            } else if (answer.optionsChosen.indexOf(option.id) != -1) {
                questionScore += option.score;
            }
        }

        if (questionScore < 0) questionScore = 0;
        displayScore += questionScore;
    }

    displayScore = displayScore.toFixed(1);
    const [updatedTest, updatedApp] = await Promise.all([
        testSubmissionService.update(req.body.testId, {
            submittedAt: Date.now(),
            status: 'finished',
            totalScore: displayScore,
            comment: req.body.comment,
        }),
        bnAppsService.update(currentBnApp.id, { test: test._id }),
    ]);

    if (!updatedTest || updatedTest.error || !updatedApp || updatedApp.error) return res.json({ error: 'Something went wrong!' });

    res.json(displayScore);
    logsService.create(req.session.mongoId, `Completed ${test.mode} BN app test`);
    let u = res.locals.userRequest;
    let modsList = '';
    for (let i = 0; i < currentBnApp.mods.length; i++) {
        modsList += currentBnApp.mods[i];
        if(i + 1 < currentBnApp.mods.length){
            modsList += ', ';
        }
    }
    let invalids = [8129817, 3178418, 2204515, 2202163];
    const assignedNat = await usersModel.aggregate([
        { $match: { group: 'nat', isSpectator: { $ne: true }, modes: test.mode, osuId: { $nin: invalids } } },
        { $sample: { size: test.mode == 'osu' ? 3 : 2 } },
    ]);
    let natList = '';
    for (let i = 0; i < assignedNat.length; i++) {
        let user = assignedNat[i];
        await bnAppsService.update(currentBnApp.id, { $push: { natEvaluators: user._id } });
        natList += user.username;
        if(i + 1 < assignedNat.length){
            natList += ', ';
        }
    }
    api.webhookPost(
        [{
            author: {
                name: `${u.username}`,
                icon_url: `https://a.ppy.sh/${u.osuId}`,
                url: `https://osu.ppy.sh/users/${u.osuId}`,
            },
            color: '7335382',
            fields:[
                {
                    name: 'New BN application',
                    value: `Test score: **${displayScore}**`,
                },
                {
                    name: 'Mods',
                    value: modsList,
                },
                {
                    name: 'Assigned NAT',
                    value: natList,
                },
            ],
        }], 
        test.mode
    );
});

module.exports = router;
