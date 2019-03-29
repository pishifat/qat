const express = require('express');
const api = require('../models/api.js');
const bnApps = require('../models/bnApp.js');
const testSubmission = require('../models/testSubmission');

const router = express.Router();

router.use(api.isLoggedIn);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    const test = await testSubmission.service.query({ applicant: req.session.mongoId, status: { $ne: 'finished' } });
    
    res.render('bnapp', {
        title: 'Beatmap Nominator Application',
        script: '../js/bnApp.js',
        isBnApp: true,
        loggedInAs: req.session.mongoId,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat',
        pendingTest: test
    });
});

/* POST a bn application */
router.post('/apply', async (req, res, next) => {
    if (req.session.mongoId) {
        let date = new Date();
        date.setDate(date.getDate() - 90);
        const currentBnApp = await bnApps.service.query({
            $and: [
                { applicant: req.session.mongoId },
                { mode: req.body.mode },
                { createdAt: { $gte: date } },
            ],
        });

        if (!currentBnApp || currentBnApp.error) {
            const newBnApp = await bnApps.service.create(
                req.session.mongoId,
                req.body.mode,
                req.body.mods
            );
            if (newBnApp && !newBnApp.error) {
                // Create test
                const t = await testSubmission.service.create(
                    req.session.mongoId,
                    req.body.mode
                );
                if (t.error) {
                    // Need to retry it somewhere later
                    return res.json({ error: 'Something went wrong while creating the test! Contact a NAT member to resolve the issue.' });
                } else {
                    await bnApps.service.update(newBnApp.id, {test: t._id});
                    // Redirect so the applicant can do the test
                    return res.redirect('/nat/bnapps');
                }
            } else {
                return res.json({ error: 'Failed to process application!' });
            }
        } else {
            if (currentBnApp.active) {
                return res.json({ error: 'Your application is still being evaluated!' });
            } else {
                return res.json({
                    error: `Your previous application was rejected (check your osu! forum PMs for details). 
                        You may apply for this game mode again on 
                        ${new Date(currentBnApp.createdAt.setDate(currentBnApp.createdAt.getDate() + 90)).toString().slice(4, 15)}.`,
                });
            }
        }
    }
});

module.exports = router;
