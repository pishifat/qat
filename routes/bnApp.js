const express = require('express');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const { getUserModsCount } = require('../helpers/scrap');
const osu = require('../helpers/osu');
const AppEvaluation = require('../models/evaluations/appEvaluation.js');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const Logger = require('../models/log.js');
const TestSubmission = require('../models/bnTest/testSubmission');

const router = express.Router();

router.use(middlewares.isLoggedIn);

/* GET bn app page */
router.get('/relevantInfo', async (req, res) => {
    const pendingTest = await TestSubmission.findOne({
        applicant: req.session.mongoId,
        status: { $ne: 'finished' },
    });

    res.json({
        hasPendingTest: Boolean(pendingTest),
    });
});

/* POST a bn application */
router.post('/apply', async (req, res) => {
    const mods = req.body.mods;
    const reasons = req.body.reasons;
    const mode = req.body.mode;

    if (!mods || !mods.length || !Array.isArray(mods) ||
        !reasons || !reasons.length || !Array.isArray(reasons) ||
        !mode
    ) {
        return res.json({ error: 'Missing mode or mods' });
    }

    if (mods.length < 2) {
        return res.json({ error: `You must enter at least two mods!` });
    }

    for (let i = 0; i < mods.length; i++) {
        mods[i] = mods[i].trim();

        util.isValidUrlOrThrow(mods[i], 'https://osu.ppy.sh/beatmapsets', `One of your mods' link is not valid`);

        if (reasons[i]) {
            reasons[i] = reasons[i].trim();
        }

        if (!reasons[i]) {
            return res.json({
                error: `You need to write their reasoning`,
            });
        }
    }

    if (res.locals.userRequest.modes.includes(mode)) {
        return res.json({
            error: `You're already a BN for this game mode!`,
        });
    }

    let cooldownDate = new Date();
    const [currentBnApp, currentBnEval, resignedOnGoodTerms, wasBnForThisMode] = await Promise.all([
        await AppEvaluation.findOne({
            user: req.session.mongoId,
            mode,
            $or: [
                { cooldownDate: { $gte: cooldownDate } },
                { active: true },
            ],
        }),
        await BnEvaluation.findOne({
            bn: req.session.mongoId,
            mode,
            consensus: 'fail',
            cooldownDate: { $gte: cooldownDate },
        }),
        await BnEvaluation.findOne({
            bn: req.session.mongoId,
            mode,
            resignedOnGoodTerms: true,
        }),
        await AppEvaluation.findOne({
            user: req.session.mongoId,
            mode,
        }),
    ]);

    if (!currentBnApp && !currentBnEval) {
        let months = 3;
        if (resignedOnGoodTerms) months = 1;
        else if (wasBnForThisMode) months = 2;

        // Check user kudosu total count & mod score
        const [userInfo, modScore] = await Promise.all([
            await osu.getUserInfo(req.session.accessToken),
            await getUserModsCount(req.session.username, mode, months),
        ]);

        if (!userInfo || userInfo.error || !modScore || modScore.error) {
            return res.json({ error: 'Something went wrong! Please retry again.' });
        }

        const requiredKudosu = mode == 'osu' ? 200 : 150;

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
            TestSubmission.generateTest(req.session.mongoId, mode),
            AppEvaluation.create({
                user: req.session.mongoId,
                mode,
                mods: req.body.mods,
                reasons: req.body.reasons,
            }),
        ]);

        if (!newBnApp || newBnApp.error || !test || test.error) {
            return res.json({ error: 'Failed to process application!' });
        } else {
            await AppEvaluation.findByIdAndUpdate(newBnApp.id, { test: test._id });

            res.json({
                success: 'ok',
            });

            Logger.generate(req.session.mongoId, `Applied for ${mode} BN`);
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
