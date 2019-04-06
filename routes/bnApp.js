const express = require('express');
const api = require('../models/api');
const bnAppsService = require('../models/bnApp.js').service;
const logsService = require('../models/log.js').service;
const testSubmissionService = require('../models/bnTest/testSubmission').service;

const router = express.Router();

router.use(api.isLoggedIn);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    const test = await testSubmissionService.query({
        applicant: req.session.mongoId,
        status: { $ne: 'finished' },
    });

    res.render('bnapp', {
        title: 'Beatmap Nominator Application',
        script: '../js/bnApp.js',
        isBnApp: true,
        loggedInAs: req.session.mongoId,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat',
        pendingTest: test,
    });
});

router.get('/mods', async (req, res, next) => {
    const modCount = await api.getUserModsCount(req.session.username);
    return res.json({ modCount: modCount });
});

/* POST a bn application */
router.post('/apply', async (req, res, next) => {
    if (req.session.mongoId) {
        // Check user kudosu total count & mod score
        const info = await api.getUserInfo(req.session.accessToken);
        const modScore = await api.getUserModsCount(req.session.username, req.body.mode);
        if (modScore >= 0 && ((req.body.mode == 'osu' && info.kudosu.total >= 200) || (req.body.mode != 'osu' && info.kudosu.total >= 150))) {
            return res.json({ error: `You don't meet the minimum score or total kudosu requirement. 
                Your mod score needs to be higher or equal than 0, currently is ${modScore}` });
        }
        
        let cooldownDate = new Date();
        cooldownDate.setDate(cooldownDate.getDate() - 90);
        const currentBnApp = await bnAppsService.query({
            applicant: req.session.mongoId,
            mode: req.body.mode,
            createdAt: { $gte: cooldownDate },
        });

        if (currentBnApp.error) {
            return res.json(currentBnApp.error);
        }

        if (!currentBnApp) {
            // Create app & test
            const [newBnApp, test] = await Promise.all([
                await testSubmissionService.create(req.session.mongoId, req.body.mode),
                await bnAppsService.create(req.session.mongoId, req.body.mode, req.body.mods),
            ]);
            if (!newBnApp || newBnApp.error || !test || test.error) {
                return res.json({ error: 'Failed to process application!' });
            } else {
                await bnAppsService.update(newBnApp.id, { test: test._id });
                logsService.create(req.session.mongoId, `Applied for ${req.body.mode} BN`);
                return res.json('pass');
            }
        } else {
            if (currentBnApp.active) {
                return res.json({ error: 'Your application is still being evaluated!' });
            } else {
                return res.json({
                    error: `Your previous application was rejected (check your osu! forum PMs for details). 
                        You may apply for this game mode again on 
                        ${new Date(currentBnApp.createdAt.setDate(currentBnApp.createdAt.getDate() + 90))
                            .toString()
                            .slice(4, 15)}.`,
                });
            }
        }
    }
});

module.exports = router;
