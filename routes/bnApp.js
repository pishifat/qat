const express = require('express');
const api = require('../helpers/api');
const BnApp = require('../models/bnApp.js');
const EvalRound = require('../models/evalRound');
const Logger = require('../models/log.js');
const TestSubmission = require('../models/bnTest/testSubmission');
const getUserModsCount = require('../helpers/helpers').getUserModsCount;

const router = express.Router();

router.use(api.isLoggedIn);

/* GET bn app page */
router.get('/', async (req, res) => {
    const test = await TestSubmission.findOne({
        applicant: req.session.mongoId,
        status: { $ne: 'finished' },
    });

    res.render('bnapp', {
        title: 'Beatmap Nominator Application',
        script: '../js/bnApp.js',
        loggedInAs: req.session.mongoId,
        isBnApp: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
        pendingTest: test,
    });
});

/* POST a bn application */
router.post('/apply', async (req, res) => {
    if (!req.body.mods || !req.body.reasons || !req.body.mode || !req.session.mongoId) {
        return res.json({ error: 'Missing mode or mods' });
    }

    //return res.json({ error: `You're not supposed to apply until this is officially announced, buddy ;)`})
    if (res.locals.userRequest.modes.indexOf(req.body.mode) >= 0) {
        return res.json({ error: 'You\'re already a BN for this game mode!' });
    }

    let cooldownDate = new Date();
    const [currentBnApp, currentBnEval, resignedOnGoodTerms, wasBnForThisMode] = await Promise.all([
        await BnApp.findOne({
            applicant: req.session.mongoId,
            mode: req.body.mode,
            $or: [
                { cooldownDate: { $gte: cooldownDate } },
                { active: true },
            ],
        }),
        await EvalRound.findOne({
            bn: req.session.mongoId,
            mode: req.body.mode,
            consensus: 'fail',
            cooldownDate: { $gte: cooldownDate },
        }),
        await EvalRound.findOne({
            bn: req.session.mongoId,
            mode: req.body.mode,
            resignedOnGoodTerms: true,
        }),
        await BnApp.findOne({
            applicant: req.session.mongoId,
            mode: req.body.mode,
        }),
    ]);

    if (!currentBnApp && !currentBnEval) {
        let months = 3;
        if (resignedOnGoodTerms) months = 1;
        else if (wasBnForThisMode) months = 2;

        // Check user kudosu total count & mod score
        const [userInfo, modScore] = await Promise.all([
            await api.getUserInfo(req.session.accessToken),
            await getUserModsCount(req.session.username, req.body.mode, months),
        ]);

        if (!userInfo || userInfo.error || !modScore || modScore.error) {
            return res.json({ error: 'Something went wrong! Please retry again.' });
        }

        const requiredKudosu = req.body.mode == 'osu' ? 200 : 150;

        if (userInfo.kudosu.total <= requiredKudosu) {
            return res.json({ error: `You do not meet the required ${requiredKudosu} kudosu to apply. You currently have ${userInfo.kudosu.total} kudosu.` });
        }

        if (modScore <= 0) {
            let additionalInfo = `Your mod score was calculated based on ${months} month${months == 1 ? '' : 's'} of activity because `;
            if (resignedOnGoodTerms) additionalInfo += 'you resigned from the BN on good terms.';
            else if (wasBnForThisMode) additionalInfo += 'you were BN for this game mode in the past.';

            return res.json({ error: `Your mod score needs to be higher or equal than 0. Currently it is ${modScore}.
                ${resignedOnGoodTerms || wasBnForThisMode ? additionalInfo : ''}` });
        }

        // Create app & test
        const [newBnApp, test] = await Promise.all([
            TestSubmission.generateTest(req.session.mongoId, req.body.mode),
            BnApp.create({
                applicant: req.session.mongoId,
                mode: req.body.mode,
                mods: req.body.mods,
                reasons: req.body.reasons,
            }),
        ]);

        if (!newBnApp || newBnApp.error || !test || test.error) {
            return res.json({ error: 'Failed to process application!' });
        } else {
            await BnApp.findByIdAndUpdate(newBnApp.id, { test: test._id });
            res.json('pass');

            Logger.generate(req.session.mongoId, `Applied for ${req.body.mode} BN`);
        }
    } else {
        if (currentBnApp) {
            if (currentBnApp.error) {
                return res.json(currentBnApp.error);
            } else if (currentBnApp.active) {
                return res.json({ error: 'Your application is still being evaluated!' });
            } else {
                return res.json({
                    error: `Your previous application was rejected (check your osu! forum PMs for details). 
                        You may apply for this game mode again on 
                        ${new Date(currentBnApp.cooldownDate).toString().slice(4, 15)}.`,
                });
            }
        } else if (currentBnEval) {
            if (currentBnEval.error) {
                return res.json(currentBnEval.error);
            } else {
                return res.json({
                    error: `You were recently removed from the Beatmap Nominators in this game mode. 
                        You may apply for this game mode again on 
                        ${new Date(currentBnEval.cooldownDate).toString().slice(4, 15)}.`,
                });
            }
        }
    }
});

module.exports = router;
