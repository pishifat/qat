const express = require('express');
const api = require('../models/api');
const bnAppsService = require('../models/bnApp.js').service;
const evalRoundsService = require('../models/evalRound').service;
const logsService = require('../models/log.js').service;
const testSubmissionService = require('../models/bnTest/testSubmission').service;
const axios = require('axios');
const cheerio = require('cheerio');
const helper = require('../routes/helper');

const router = express.Router();

router.use(api.isLoggedIn);

/**
 * Returns array with values per month ex: [1,1,1] or the calculated score ex: 7,77
 * @param {string} username 
 * @param {string} mode To calculate and return the score, pass this argument
 */
async function getUserModsCount(username, mode) {
    let baseUrl = `https://osu.ppy.sh/beatmapsets/events?limit=50&types[]=kudosu_gain&types[]=kudosu_lost&user=${username}`;
    let maxDate = new Date();
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);
    let modCount = [];
    let modScore = 0;
    let expectedMods = (mode && mode == 'osu' ? 4 : 3);
    // Loops for months
    for (let i = 0; i < 3; i++) {
        const maxDateStr = `${maxDate.getFullYear()}-${maxDate.getMonth() + 1}-${maxDate.getDate()}`;
        const minDateStr = `${minDate.getFullYear()}-${minDate.getMonth() + 1}-${minDate.getDate()}`;
        let urlWithDate = baseUrl + `&min_date=${minDateStr}&max_date=${maxDateStr}`;
        let monthMods = [];
        let hasEvents = true;
        let pageNumber = 1;
        // Loops through pages of a month
        while (hasEvents) {
            let finalUrl = urlWithDate + `&page=${pageNumber}`
            try {
                const historyHtml = await axios.get(finalUrl);
                const $ = cheerio.load(historyHtml.data);
                if (!$('.beatmapset-event').length) {
                    hasEvents = false;
                } else {
                    let pageMods = [];
                    $('.beatmapset-event').each(function(k, v) {            
                        const url = $(v).find('a').first().attr('href');
                        let mod = { 
                            beatmapset: helper.getBeatmapsetIdFromUrl(url),
                            url: url
                        };
                        
                        if ($(v).find('.beatmapset-event__icon--kudosu-gain').length) {
                            mod.isGain = true;
                        } else {
                            mod.isGain = false;
                        }
                        
                        pageMods.push(mod);
                    });
                    
                    // Filters repeated sets and checks for denied KDs
                    pageMods.forEach(mod => {
                        if (mod.isGain && 
                            pageMods.findIndex(m => m.url == mod.url && !m.isGain) === -1 && 
                            monthMods.findIndex(m => m.beatmapset == mod.beatmapset) === -1) {
                                monthMods.push(mod);
                        }
                    });
                }
            } catch (error) {
                return res.json({ error: error._message });
            }
    
            pageNumber ++;
        }
        
        modScore += Math.log(1 + monthMods.length) / Math.log(Math.sqrt(1 + expectedMods)) - (2 * (1 + expectedMods)) / (1 + monthMods.length);
        modCount.push(monthMods.length);
        minDate.setDate(minDate.getDate() - 30);
        maxDate.setDate(maxDate.getDate() - 30);
    }

    if (mode) {
        return modScore.toFixed(2);
    } else {
        return modCount;
    }
}

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
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isBnEvaluator: res.locals.userRequest.group == 'bn' && res.locals.userRequest.isBnEvaluator  && !res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        pendingTest: test,
    });
});

router.get('/mods', async (req, res, next) => {
    const modCount = await getUserModsCount(req.session.username);
    return res.json({ modCount: modCount });
});

/* POST a bn application */
router.post('/apply', async (req, res, next) => {
    if (!req.body.mods || !req.body.mode || !req.session.mongoId) {
        return res.json({ error: 'Missing mode or mods' });
    }

    //return res.json({ error: `You're not supposed to apply until this is officially announced, buddy ;)`})
    if(res.locals.userRequest.modes.indexOf(req.body.mode) >= 0){
        return res.json({ error: `You're already a BN for this game mode!`});
    }
    
    let cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - 90);
    const [currentBnApp, currentBnEval] = await Promise.all([
        await bnAppsService.query({
            applicant: req.session.mongoId,
            mode: req.body.mode,
            updatedAt: { $gte: cooldownDate },
        }),
        await evalRoundsService.query({
            bn: req.session.mongoId,
            mode: req.body.mode,
            updatedAt: { $gte: cooldownDate },
        })
    ]);

    if (!currentBnApp && !currentBnEval) {
        // Check user kudosu total count & mod score
        const [userInfo, modScore] = await Promise.all([
            await api.getUserInfo(req.session.accessToken),
            await getUserModsCount(req.session.username, req.body.mode),
        ]);

        if (!userInfo || userInfo.error || !modScore || modScore.error) {
            return res.json({ error: 'Something went wrong! Please retry again.' });
        }

        if (modScore <= 0 || ((req.body.mode == 'osu' && userInfo.kudosu.total <= 200) || (req.body.mode != 'osu' && userInfo.kudosu.total <= 150))) {
            return res.json({ error: `You don't meet the minimum score or total kudosu requirement. 
                Your mod score needs to be higher or equal than 0. Currently it is ${modScore}` });
        }
        
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
        if (currentBnApp){
            if (currentBnApp.error) {
                return res.json(currentBnApp.error);
            } else if (currentBnApp.active) {
                return res.json({ error: 'Your application is still being evaluated!' });
                }else {
                return res.json({
                    error: `Your previous application was rejected (check your osu! forum PMs for details). 
                        You may apply for this game mode again on 
                        ${new Date(currentBnApp.updatedAt.setDate(currentBnApp.updatedAt.getDate() + 90))
                            .toString()
                            .slice(4, 15)}.`,
                });
            }
        } else if (currentBnEval) {
            if (currentBnEval.error) {
                return res.json(currentBnEval.error);
            } else {
                return res.json({
                    error: `You were recently removed from the Beatmap Nominators in this game mode. 
                        You may apply for this game mode again on 
                        ${new Date(currentBnEval.updatedAt.setDate(currentBnEval.updatedAt.getDate() + 90))
                            .toString()
                            .slice(4, 15)}.`,
                });
            }
        }
    }
});

module.exports = router;
