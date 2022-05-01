const express = require('express');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const { getUserModScore, getUserModsCount } = require('../helpers/scrap');
const osu = require('../helpers/osu');
const AppEvaluation = require('../models/evaluations/appEvaluation.js');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const Logger = require('../models/log.js');
const TestSubmission = require('../models/bnTest/testSubmission');
const ResignationEvaluation = require('../models/evaluations/resignationEvaluation');
const { ResignationConsensus, BnEvaluationAddition } = require('../shared/enums');

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
    const { mods, reasons, mode } = req.body;

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
        reasons[i] = reasons[i] && reasons[i].trim();

        util.isValidUrlOrThrow(mods[i], 'https://osu.ppy.sh/beatmapsets', `One of your mod links is not valid`);

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
    const [currentBnApp, currentBnEval, lastResignation, lastCurrentBnEval] = await Promise.all([
        AppEvaluation.findOne({
            user: req.session.mongoId,
            mode,
            $or: [
                { cooldownDate: { $gte: cooldownDate } },
                { active: true },
            ],
        }),
        BnEvaluation.findOne({
            user: req.session.mongoId,
            mode,
            consensus: 'removeFromBn',
            cooldownDate: { $gte: cooldownDate },
        }),
        ResignationEvaluation.findOne({
            user: req.session.mongoId,
            mode,
        })
            .sort({ updatedAt: -1 }),
        BnEvaluation.findOne({
            user: req.session.mongoId,
            mode,
            consensus: 'removeFromBn',
        }),
    ]);

    const wasBn = res.locals.userRequest.history && res.locals.userRequest.history.length;
    const resignedOnGoodTerms = lastResignation && lastResignation.consensus === ResignationConsensus.ResignedOnGoodTerms;
    const kickedForActivity = lastCurrentBnEval && lastCurrentBnEval.addition === BnEvaluationAddition.LowActivityWarning;

    if (!currentBnApp && !currentBnEval) {
        let months = 3;

        if (resignedOnGoodTerms) months = 1;
        else if (wasBn || kickedForActivity) months = 2;

        // Check user kudosu total count & mod score
        const [userInfo, modScore] = await Promise.all([
            osu.getUserInfo(req.session.accessToken),
            getUserModScore(req.session.accessToken, req.session.username, months, mode),
        ]);

        if (!userInfo || userInfo.error || (!modScore && modScore !== 0)) {
            return res.json({ error: 'Something went wrong! Please retry again.' });
        }

        const requiredKudosu = mode == 'osu' ? 200 : 150;

        if (userInfo.kudosu.total <= requiredKudosu) {
            return res.json({ error: `You do not meet the required ${requiredKudosu} kudosu to apply. You currently have ${userInfo.kudosu.total} kudosu.` });
        }

        if (kickedForActivity) {
            const modsCount = await getUserModsCount(req.session.accessToken, req.session.username, months);
            const reducer = (accumulator, currentValue) => accumulator + currentValue;
            const modsThreshold = 8;

            const totalMods = modsCount.reduce(reducer);

            if (totalMods < modsThreshold) {
                return res.json({ error: `You need at least ${modsThreshold} mods within the last 60 days to apply because you were recently removed for low activity!` } );
            }
        } else if (modScore < 0 && mode == 'osu') {
            let additionalInfo = `Your mod score was calculated based on ${months} month${months == 1 ? '' : 's'} of activity because `;
            if (resignedOnGoodTerms) additionalInfo += 'you resigned from the BN on good terms.';
            else if (wasBn) additionalInfo += 'you were BN for this game mode in the past.';

            return res.json({ error: `Your mod score needs to be higher or equal than 0. Currently it is ${modScore}.
                ${resignedOnGoodTerms || wasBn ? additionalInfo : ''}` });
        }

        // Create app & test
        const [newBnApp, test] = await Promise.all([
            TestSubmission.generateTest(req.session.mongoId, mode),
            AppEvaluation.create({
                user: req.session.mongoId,
                mode,
                mods,
                reasons,
            }),
        ]);

        if (!newBnApp || newBnApp.error || !test) {
            return res.json({ error: 'Failed to process application!' });
        } else {
            await AppEvaluation.findByIdAndUpdate(newBnApp.id, { test: test._id });

            res.json({
                success: 'Applied',
            });

            Logger.generate(req.session.mongoId, `Applied for ${mode} BN`, 'application', newBnApp._id);
        }
    } else {
        if (currentBnApp) {
            if (currentBnApp.active) {
                return res.json({ error: 'Your application is still being evaluated!' });
            } else {
                return res.json({
                    error: `Your previous application was rejected (check your osu! messages for details). 
                            You may apply for this game mode again on 
                            ${new Date(currentBnApp.cooldownDate).toString().slice(4, 24)}.`,
                });
            }
        } else if (currentBnEval) {
            return res.json({
                error: `You were recently removed from the Beatmap Nominators in this game mode. 
                        You may apply for this game mode again on 
                        ${new Date(currentBnEval.cooldownDate).toString().slice(4, 24)}.`,
            });
        }
    }
});

module.exports = router;
