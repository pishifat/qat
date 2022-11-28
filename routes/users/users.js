const express = require('express');
const User = require('../../models/user');
const Logger = require('../../models/log');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const Evaluation = require('../../models/evaluations/evaluation');
const Discussion = require('../../models/discussion');
const ResignationEvaluation = require('../../models/evaluations/resignationEvaluation');
const Aiess = require('../../models/aiess');
const Settings = require('../../models/settings');
const middlewares = require('../../helpers/middlewares');
const discord = require('../../helpers/discord');
const getGeneralEvents = require('../evaluations/bnEval').getGeneralEvents;
const getUserModsCount = require('../../helpers/scrap').getUserModsCount;
const findAdditionalBnMonths = require('../../helpers/scrap').findAdditionalBnMonths;
const util = require('../../helpers/util');
const { BnEvaluationConsensus, BnEvaluationAddition } = require('../../shared/enums');
const { findEvaluationsWithoutIncident } = require('../evaluations/evaluations');

const router = express.Router();

router.use(middlewares.isLoggedIn);

const evaluationsPopulate = [
    {
        path: 'reviews',
        select: 'evaluator createdAt',
    },
    {
        path: 'user',
        select: 'username',
    },
];

/* GET user list */
router.get('/relevantInfo', async (req, res) => {
    const users = await User
        .find({
            groups: { $in: ['bn', 'nat'] },
        });

    res.json({
        users,
    });
});

/* GET extended user list */
router.get('/loadPreviousBnAndNat', async (req, res) => {
    const users = await User.find({
        history: { $exists: true, $ne: [] },
    }).sort({ username: 1 });

    res.json({ users });
});

/* GET user */
router.get('/loadUser/:userInput', async (req, res) => {
    if (!req.params.userInput.length) {
        return res.json({ error: 'No input' });
    }

    res.json(await User.findByUsernameOrOsuId(req.params.userInput) || await User.findById(req.params.userInput));
});

/* GET user next evaluation */
router.get('/loadNextEvaluation/:id/:mode', async (req, res) => {
    const er = await BnEvaluation.findOne({ user: req.params.id, mode: req.params.mode, active: true });

    if (!er) {
        return res.json('Never');
    }

    res.json(er.deadline);
});

/* POST adjust next evaluation deadline */
router.post('/adjustEvaluationDeadline/:id/:mode', middlewares.isNat, async (req, res) => {
    const er = await BnEvaluation
        .findOne({ user: req.params.id, mode: req.params.mode, active: true })
        .populate({ path: 'user', select: 'username' });

    const newDeadline = new Date(req.body.newDeadline);

    er.deadline = newDeadline;
    await er.save();

    res.json({
        success: 'Updated',
        deadline: newDeadline,
    });

    Logger.generate(
        req.session.mongoId,
        `Adjusted "${er.user.username}" ${req.params.mode} current BN evaluation deadline to ${newDeadline.toISOString().slice(0,10)}`,
        'bnEvaluation',
        er._id
    );
});

/* POST reset next evaluation deadline based on previous evaluations */
router.post('/resetEvaluationDeadline/:id/:mode', middlewares.isNat, async (req, res) => {
    const userId = req.params.id;
    const mode = req.params.mode;

    const [evaluation, pendingEvaluation] = await Promise.all([
        BnEvaluation
            .findOne({
                user: userId,
                mode,
                consensus: { $exists: true },
                active: false,
            })
            .sort({ updatedAt: -1 }),
        BnEvaluation
            .findOne({
                user: userId,
                mode,
                active: true,
            })
            .populate({
                path: 'user',
                select: 'username',
            }),
    ]);

    let deadline = new Date(evaluation.archivedAt);

    if (evaluation.consensus === BnEvaluationConsensus.ProbationBn) {
        deadline.setDate(deadline.getDate() + 40);
        
        if (pendingEvaluation) {
            pendingEvaluation.deadline = deadline;
            await pendingEvaluation.save();
        } else {
            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
                activityToCheck: 40,
            });
        }
    }

    else if (evaluation.consensus === BnEvaluationConsensus.FullBn) {
        let activityToCheck = 90;

        if (evaluation.addition === BnEvaluationAddition.LowActivityWarning) {
            deadline.setDate(deadline.getDate() + 40); // +40 days
        } else {
            const random90 = Math.round(Math.random() * (95 - 85) + 85); // between 85 and 95 days
            const random180 = Math.round(Math.random() * (185 - 175) + 175); // between 185 and 175 days

            const evaluationsWithoutIncident = await findEvaluationsWithoutIncident(userId);

            if (evaluationsWithoutIncident > 1) {
                deadline.setDate(deadline.getDate() + random180);
                activityToCheck = random180;
            } else {
                deadline.setDate(deadline.getDate() + random90);
                activityToCheck = random90;
            }
        }

        if (pendingEvaluation) {
            pendingEvaluation.deadline = deadline;
            pendingEvaluation.activityToCheck = activityToCheck;
            await pendingEvaluation.save();
        } else {
            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
                activityToCheck,
            });
        }
    }

    res.json({
        deadline
    });

    Logger.generate(
        req.session.mongoId,
        `Reset "${pendingEvaluation.user.username}" ${mode} current BN evaluation deadline to ${deadline.toISOString().slice(0,10)}`,
        'bnEvaluation',
        pendingEvaluation._id
    );
});

/* GET find NAT activity */
router.get('/findNatActivity/:days/:mode', async (req, res) => {
    const minAppDate = new Date();
    minAppDate.setDate(minAppDate.getDate() - (parseInt(req.params.days) + 14));
    const minEvalDate = new Date();
    minEvalDate.setDate(minEvalDate.getDate() - (parseInt(req.params.days)));
    const maxDate = new Date();
    const [users, applicationEvaluations, bnEvaluations] = await Promise.all([
        User
            .find({
                groups: 'nat',
                'modesInfo.mode': req.params.mode,
                isBnEvaluator: true,
            })
            .sort({ username: 1 }),

        AppEvaluation
            .find({
                mode: req.params.mode,
                createdAt: { $gte: minAppDate, $lte: maxDate },
                discussion: true,
            })
            .populate(evaluationsPopulate),

        Evaluation
            .find({
                mode: req.params.mode,
                deadline: { $gte: minEvalDate, $lte: maxDate },
                discussion: true,
            })
            .populate(evaluationsPopulate),
    ]);
    let info = [];
    users.forEach(user => {
        let evalsOnBnApps = 0;
        let evalsOnCurrentBnEvals = 0;

        applicationEvaluations.forEach(app => {
            evalsOnBnApps += app.reviews.filter(r => r.evaluator == user.id).length;
        });

        bnEvaluations.forEach(round => {
            evalsOnCurrentBnEvals += round.reviews.filter(r => r.evaluator == user.id).length;
        });

        const joinHistory = user.history.filter(h => h.kind === 'joined' &&  h.group === 'nat');
        const lastJoin = joinHistory[joinHistory.length - 1];

        info.push({
            username: user.username,
            osuId: user.osuId,
            totalBnAppEvals: evalsOnBnApps,
            totalCurrentBnEvals: evalsOnCurrentBnEvals,
            joinDate: lastJoin && lastJoin.date,
        });
    });

    res.json({
        info,
        bnAppsCount: applicationEvaluations.length,
        bnEvaluationsCount: bnEvaluations.length,
    });
});

/* GET find NAT activity but cooler */
router.get('/findNatActivity2/:number/:mode', async (req, res) => {
    const limit = parseInt(req.params.number);
    const mode = req.params.mode;

    if (isNaN(limit)) {
        return res.json({ error: 'Invalid number' });
    }

    const [users, appEvals, currentBnEvals] = await Promise.all([
        User
            .find({
                groups: 'nat',
                'modesInfo.mode': mode,
                isBnEvaluator: true,
            })
            .sort({ username: 1 }),

        AppEvaluation
            .find({
                mode,
                active: false,
                feedback: { $exists: true },
                reviews: { $ne: [] },
            })
            .populate(evaluationsPopulate)
            .sort({ updatedAt: -1 })
            .limit(limit),

        Evaluation
            .find({
                mode,
                active: false,
                feedback: { $exists: true },
                reviews: { $ne: [] },
            })
            .populate(evaluationsPopulate)
            .sort({ updatedAt: -1 })
            .limit(limit),
    ]);


    let info = [];
    let total = 0;

    for (const user of users) {
        let participatedAppEvals = 0;
        let participatedCurrentBnEvals = 0;
        let totalFeedbackWritten = 0;
        let recentlyJoinedNat = false;
        let totalDaysOverdue = 0;

        for (const app of appEvals) {
            const relevantEval = app.reviews.filter(r => r.evaluator == user.id);

            if (relevantEval && relevantEval.length) {
                participatedAppEvals ++;
                let manualDeadline = new Date(app.createdAt);
                manualDeadline.setDate(manualDeadline.getDate() + 14);

                totalDaysOverdue += util.findDaysBetweenDates(new Date(relevantEval[0].createdAt), new Date(manualDeadline));
            }
        }

        for (const round of currentBnEvals) {
            const relevantEval = round.reviews.filter(r => r.evaluator == user.id);

            if (relevantEval && relevantEval.length) {
                participatedCurrentBnEvals ++;
                totalDaysOverdue += util.findDaysBetweenDates(new Date(relevantEval[0].createdAt), new Date(round.deadline));
            }
        }

        const totalParticipated = participatedAppEvals + participatedCurrentBnEvals;
        total += totalParticipated;

        const joinHistory = user.history.filter(h => h.kind === 'joined' &&  h.group === 'nat');
        const lastJoin = joinHistory[joinHistory.length - 1];

        if (lastJoin.date > appEvals[limit-1].archivedAt || lastJoin.date > currentBnEvals[limit-1].archivedAt) {
            recentlyJoinedNat = true;
        }

        info.push({
            username: user.username,
            osuId: user.osuId,
            inBag: user.inBag,
            participatedAppEvals,
            participatedCurrentBnEvals,
            totalParticipated,
            totalDaysOverdue,
            totalFeedbackWritten,
            recentlyJoinedNat,
            limit,
        });
    }

    /*for (const app of appEvals) {
        const log = await Logger
            .findOne({
                relatedId: app._id,
                action: `Created feedback of ${app.user.username}'s ${app.mode} evaluation`,
            })
            .populate({ path: 'user', select: 'username osuId' })
            .sort({ createdAt: -1 });


        const userIndex = info.findIndex(u => u.osuId == log.user.osuId);

        if (userIndex > -1) {
            info[userIndex].totalFeedbackWritten++;
        }
    }

    for (const round of currentBnEvals) {
        const log = await Logger
            .findOne({
                relatedId: round._id,
                action: `Created feedback of ${round.user.username}'s ${round.mode} evaluation`,
            })
            .populate({ path: 'user', select: 'username osuId' })
            .sort({ createdAt: -1 });

        const userIndex = info.findIndex(u => u.osuId == log.user.osuId);

        if (userIndex > -1) {
            info[userIndex].totalFeedbackWritten++;
        }
    }*/

    info.sort((a, b) => {
        if (a.totalParticipated > b.totalParticipated) return -1;
        if (a.totalParticipated < b.totalParticipated) return 1;

        return 0;
    });

    res.json({
        info,
        total,
    });
});

/* GET find BN activity */
router.get('/findBnActivity/:days/:mode', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - parseInt(req.params.days));
    let maxDate = new Date();
    const [users, allEvents, allActiveBnEvaluations] = await Promise.all([
        User
            .find({
                groups: { $in: ['nat','bn'] },
                'modesInfo.mode': req.params.mode,
            })
            .sort({ username: 1 }),
        Aiess.getAllActivity(minDate, maxDate, req.params.mode),
        BnEvaluation.find({ active: true, mode: req.params.mode }),
    ]);

    if (allEvents.error) {
        return res.json({
            error: 'Something went wrong',
        });
    }

    let info = [];
    users.forEach(user => {
        let uniqueNominations = [];
        let nominationResets = 0;

        for (let i = 0; i < allEvents.length; i++) {
            const type = allEvents[i]._id;
            const events = allEvents[i].events;

            if (type == 'nominate' || type == 'qualify') {
                for (let j = 0; j < events.length; j++) {
                    let event = events[j];

                    if (event.userId == user.osuId) {
                        if (uniqueNominations.length == 0 || !uniqueNominations.find(n => n.beatmapsetId == event.beatmapsetId)) {
                            uniqueNominations.push(event);
                        }
                    }
                }
            } else if (type == 'nomination_reset' || type == 'disqualify') {
                nominationResets += events.filter(e => e.userId == user.osuId).length;
            }
        }

        let activeEval = allActiveBnEvaluations.find(e => e.user == user.id);

        let deadline;

        if (activeEval) {
            const firstDate = new Date(activeEval.deadline);
            const secondDate = new Date(activeEval.deadline);
            firstDate.setDate(firstDate.getDate() - 7);
            secondDate.setDate(secondDate.getDate() + 7);
            deadline = `Between ${firstDate.toISOString().slice(0,10)} and ${secondDate.toISOString().slice(0,10)}`;
        }

        const joinHistory = user.history.filter(h => h.kind === 'joined' &&  h.group === 'bn');
        const lastJoin = joinHistory[joinHistory.length - 1];

        info.push({
            username: user.username,
            osuId: user.osuId,
            uniqueNominations: uniqueNominations.length,
            nominationResets,
            joinDate: lastJoin && lastJoin.date,
            nextEvaluation: deadline,
            genrePreferences: user.genrePreferences,
            languagePreferences: user.languagePreferences,
            detailPreferences: user.detailPreferences,
            osuStylePreferences: user.osuStylePreferences,
            taikoStylePreferences: user.taikoStylePreferences,
            catchStylePreferences: user.catchStylePreferences,
            maniaStylePreferences: user.maniaStylePreferences,
            maniaKeymodePreferences: user.maniaKeymodePreferences,
            mapperPreferences: user.mapperPreferences,
        });
    });

    res.json(info);
});

router.get('/findGmtActivity/:days', async (req, res) => {
    let minDate = new Date();
    minDate.setDate(minDate.getDate() - parseInt(req.params.days));

    const [users, discussions] = await Promise.all([
        User
            .find({
                groups: 'gmt',
            })
            .sort({ username: 1 }),

        await Discussion
            .find({
                isContentReview: true,
                updatedAt: { $gte: minDate },
            })
            .populate('mediations'),
    ]);

    let info = [];

    for (const user of users) {
        let totalVotes = 0;

        for (const discussion of discussions) {
            const userMediations = discussion.mediations.filter(m => m.mediator.toString() == user.id);
            totalVotes += userMediations.length;
        }

        info.push({
            username: user.username,
            osuId: user.osuId,
            totalVotes,
        });
    }

    res.json({
        info,
    });
});

/* POST update discord ID */
router.post('/updateDiscordId', middlewares.isNatOrTrialNat, async (req, res) => {
    let user;

    if (req.body.userId) {
        user = await User.findById(req.body.userId);
    } else {
        user = res.locals.userRequest;
    }

    user.discordId = req.body.discordId;
    await user.save();

    res.json({
        success: 'Updated',
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" discord ID to ${user.discordId}`,
        'user',
        user._id
    );
});

/* POST switch bn evaluator */
router.post('/:id/switchBnEvaluator', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.isBnEvaluator = !user.isBnEvaluator;
    await user.save();

    res.json({
        user,
        success: 'Toggled mock evaluations',
    });

    Logger.generate(
        req.session.mongoId,
        `Opted "${user.username}" ${user.isBnEvaluator ? 'in to' : 'out of'} optional BN app evaluation input`,
        'user',
        user._id
    );
});

/* POST switch isBnFinderAnonymous */
router.post('/:id/switchIsBnFinderAnonymous', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.isBnFinderAnonymous = !user.isBnFinderAnonymous;
    await user.save();

    res.json({
        user,
        success: 'Toggled anonymous setting',
    });

    Logger.generate(
        req.session.mongoId,
        `Toggled "${user.username}" ${user.isBnFinderAnonymous ? 'on' : 'off'} for anonymous BN Finder setting`,
        'user',
        user._id
    );
});

/* POST switch/update request status */
router.post('/:id/updateRequestStatus', middlewares.isBnOrNat, async (req, res) => {
    if (req.body.requestLink) {
        util.isValidUrlOrThrow(req.body.requestLink);
    }

    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.requestStatus = req.body.requestStatus;
    user.requestLink = req.body.requestLink;
    await user.save();

    res.json({
        success: 'Updated',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" status to ${user.requestStatus} (${user.requestLink || 'No link'})`,
        'user',
        user._id
    );
});

/* POST update genre preferences */
router.post('/:id/updateGenrePreferences', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const genre = req.body.genre;
    const isPreference = req.body.isPreference;

    if (user.genrePreferences.length >= 3 && !user.genrePreferences.includes(genre) && isPreference) {
        return res.json({
            error: 'Cannot save more than 3 preferences',
            user,
        });
    }

    if (genre.length && !user.genrePreferences.includes(genre) && isPreference) {
        user.genrePreferences.push(genre);

        if (user.genreNegativePreferences.indexOf(genre) >= 0) {
            const i = user.genreNegativePreferences.indexOf(genre);
            user.genreNegativePreferences.splice(i,1);
        }
    } else if (user.genrePreferences.includes(genre) && isPreference) {
        const i = user.genrePreferences.indexOf(genre);
        user.genrePreferences.splice(i,1);
    } else if (genre.length && !user.genreNegativePreferences.includes(genre) && !isPreference) {
        user.genreNegativePreferences.push(genre);

        if (user.genrePreferences.indexOf(genre) >= 0) {
            const i = user.genrePreferences.indexOf(genre);
            user.genrePreferences.splice(i,1);
        }
    } else if (user.genreNegativePreferences.includes(genre) && !isPreference) {
        const i = user.genreNegativePreferences.indexOf(genre);
        user.genreNegativePreferences.splice(i,1);
    }

    await user.save();

    res.json({
        success: 'Updated',
        user,
    });
});

/* POST update language preferences */
router.post('/:id/updateLanguagePreferences', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const language = req.body.language;
    const isPreference = req.body.isPreference;

    if (user.languagePreferences.length >= 3 && !user.languagePreferences.includes(language) && isPreference) {
        return res.json({
            error: 'Cannot save more than 3 preferences',
            user,
        });
    }

    if (language.length && !user.languagePreferences.includes(language) && isPreference) {
        user.languagePreferences.push(language);

        if (user.languageNegativePreferences.indexOf(language) >= 0) {
            const i = user.languageNegativePreferences.indexOf(language);
            user.languageNegativePreferences.splice(i,1);
        }
    } else if (user.languagePreferences.includes(language) && isPreference) {
        const i = user.languagePreferences.indexOf(language);
        user.languagePreferences.splice(i,1);
    } else if (language.length && !user.languageNegativePreferences.includes(language) && !isPreference) {
        user.languageNegativePreferences.push(language);

        if (user.languagePreferences.indexOf(language) >= 0) {
            const i = user.languagePreferences.indexOf(language);
            user.languagePreferences.splice(i,1);
        }
    } else if (user.languageNegativePreferences.includes(language) && !isPreference) {
        const i = user.languageNegativePreferences.indexOf(language);
        user.languageNegativePreferences.splice(i,1);
    }

    await user.save();

    res.json({
        success: 'Updated',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" language preferences to ${user.languagePreferences}`,
        'user',
        user._id
    );
});

/* POST update map style preferences */
router.post('/:id/updateStylePreferences/:mode', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const style = req.body.style;
    const mode = req.params.mode;
    const isPreference = req.body.isPreference;

    let relevantStylePreferences = mode == 'osu' ? user.osuStylePreferences : mode == 'taiko' ? user.taikoStylePreferences : mode == 'catch' ? user.catchStylePreferences : user.maniaStylePreferences;
    let relevantStyleNegativePreferences = mode == 'osu' ? user.osuStyleNegativePreferences : mode == 'taiko' ? user.taikoStyleNegativePreferences : mode == 'catch' ? user.catchStyleNegativePreferences : user.maniaStyleNegativePreferences;

    if (relevantStylePreferences.length >= 3 && !relevantStylePreferences.includes(style) && isPreference) {
        return res.json({
            error: 'Cannot save more than 3 preferences',
            user,
        });
    }

    if (style.length && !relevantStylePreferences.includes(style) && isPreference) {
        relevantStylePreferences.push(style);

        if (relevantStyleNegativePreferences.indexOf(style) >= 0) {
            const i = relevantStyleNegativePreferences.indexOf(style);
            relevantStyleNegativePreferences.splice(i,1);
        }
    } else if (relevantStylePreferences.includes(style) && isPreference) {
        const i = relevantStylePreferences.indexOf(style);
        relevantStylePreferences.splice(i,1);
    } else if (style.length && !relevantStyleNegativePreferences.includes(style) && !isPreference) {
        relevantStyleNegativePreferences.push(style);

        if (relevantStylePreferences.indexOf(style) >= 0) {
            const i = relevantStylePreferences.indexOf(style);
            relevantStylePreferences.splice(i,1);
        }
    } else if (relevantStyleNegativePreferences.includes(style) && !isPreference) {
        const i = relevantStyleNegativePreferences.indexOf(style);
        relevantStyleNegativePreferences.splice(i,1);
    }

    if (mode == 'osu') {
        user.osuStylePreferences = relevantStylePreferences;
        user.osuStyleNegativePreferences = relevantStyleNegativePreferences;
    } else if (mode == 'taiko') {
        user.taikoStylePreferences = relevantStylePreferences;
        user.taikoStyleNegativePreferences = relevantStyleNegativePreferences;
    } else if (mode == 'catch') {
        user.catchStylePreferences = relevantStylePreferences;
        user.catchStyleNegativePreferences = relevantStyleNegativePreferences;
    } else if (mode == 'mania') {
        user.maniaStylePreferences = relevantStylePreferences;
        user.maniaStyleNegativePreferences = relevantStyleNegativePreferences;
    }

    await user.save();

    res.json({
        success: 'Updated',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" ${mode} style preferences to ${relevantStylePreferences}`,
        'user',
        user._id
    );
});

/* POST update mania keymode preferences */
router.post('/:id/updateKeymodePreferences', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const keymode = req.body.keymode;
    const isPreference = req.body.isPreference;

    if (user.maniaKeymodePreferences.length >= 3 && !user.maniaKeymodePreferences.includes(keymode) && isPreference) {
        return res.json({
            error: 'Cannot save more than 3 preferences',
            user,
        });
    }

    if (keymode.length && !user.maniaKeymodePreferences.includes(keymode) && isPreference) {
        user.maniaKeymodePreferences.push(keymode);

        if (user.maniaKeymodeNegativePreferences.indexOf(keymode) >= 0) {
            const i = user.maniaKeymodeNegativePreferences.indexOf(keymode);
            user.maniaKeymodeNegativePreferences.splice(i,1);
        }
    } else if (user.maniaKeymodePreferences.includes(keymode) && isPreference) {
        const i = user.maniaKeymodePreferences.indexOf(keymode);
        user.maniaKeymodePreferences.splice(i,1);
    } else if (keymode.length && !user.maniaKeymodeNegativePreferences.includes(keymode) && !isPreference) {
        user.maniaKeymodeNegativePreferences.push(keymode);

        if (user.maniaKeymodePreferences.indexOf(keymode) >= 0) {
            const i = user.maniaKeymodePreferences.indexOf(keymode);
            user.maniaKeymodePreferences.splice(i,1);
        }
    } else if (user.maniaKeymodeNegativePreferences.includes(keymode) && !isPreference) {
        const i = user.maniaKeymodeNegativePreferences.indexOf(keymode);
        user.maniaKeymodeNegativePreferences.splice(i,1);
    }

    await user.save();

    res.json({
        success: 'Updated',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" keymode preferences to ${user.maniaKeymodePreferences}`,
        'user',
        user._id
    );
});

/* POST update song detail preferences */
router.post('/:id/updateDetailPreferences', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const detail = req.body.detail;
    const isPreference = req.body.isPreference;

    if (user.detailPreferences.length >= 3 && !user.detailPreferences.includes(detail) && isPreference) {
        return res.json({
            error: 'Cannot save more than 3 preferences',
            user,
        });
    }

    if (detail.length && !user.detailPreferences.includes(detail) && isPreference) {
        user.detailPreferences.push(detail);

        if (user.detailNegativePreferences.indexOf(detail) >= 0) {
            const i = user.detailNegativePreferences.indexOf(detail);
            user.detailNegativePreferences.splice(i,1);
        }
    } else if (user.detailPreferences.includes(detail) && isPreference) {
        const i = user.detailPreferences.indexOf(detail);
        user.detailPreferences.splice(i,1);
    } else if (detail.length && !user.detailNegativePreferences.includes(detail) && !isPreference) {
        user.detailNegativePreferences.push(detail);

        if (user.detailPreferences.indexOf(detail) >= 0) {
            const i = user.detailPreferences.indexOf(detail);
            user.detailPreferences.splice(i,1);
        }
    } else if (user.detailNegativePreferences.includes(detail) && !isPreference) {
        const i = user.detailNegativePreferences.indexOf(detail);
        user.detailNegativePreferences.splice(i,1);
    }

    await user.save();

    res.json({
        success: 'Updated',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" detail preferences to ${user.detailPreferences}`,
        'user',
        user._id
    );
});

/* POST update mapper preferences */
router.post('/:id/updateMapperPreferences', middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const mapper = req.body.mapper;
    const isPreference = req.body.isPreference;

    if (user.mapperPreferences.length >= 3 && !user.mapperPreferences.includes(mapper)) {
        return res.json({
            error: 'Cannot save more than 3 preferences',
            user,
        });
    }

    if (mapper.length && !user.mapperPreferences.includes(mapper) && isPreference) {
        user.mapperPreferences.push(mapper);

        if (user.mapperNegativePreferences.indexOf(mapper) >= 0) {
            const i = user.mapperNegativePreferences.indexOf(mapper);
            user.mapperNegativePreferences.splice(i,1);
        }
    } else if (user.mapperPreferences.includes(mapper) && isPreference) {
        const i = user.mapperPreferences.indexOf(mapper);
        user.mapperPreferences.splice(i,1);
    } else if (mapper.length && !user.mapperNegativePreferences.includes(mapper) && !isPreference) {
        user.mapperNegativePreferences.push(mapper);

        if (user.mapperPreferences.indexOf(mapper) >= 0) {
            const i = user.mapperPreferences.indexOf(mapper);
            user.mapperPreferences.splice(i,1);
        }
    } else if (user.mapperNegativePreferences.includes(mapper) && !isPreference) {
        const i = user.mapperNegativePreferences.indexOf(mapper);
        user.mapperNegativePreferences.splice(i,1);
    }

    await user.save();

    res.json({
        success: 'Updated',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" mapper preferences to ${user.mapperPreferences}`,
        'user',
        user._id
    );
});

/* POST switch user group */
router.post('/:id/switchUserGroup', middlewares.isNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (user.isNat) {
        const i = user.groups.findIndex(g => g === 'nat');
        if (i !== -1) user.groups.splice(i, 1, 'bn');
    } else {
        await Evaluation.deleteUserActiveEvaluations(user._id);
        user.isTrialNat = false;
        const i = user.groups.findIndex(g => g === 'bn');
        if (i !== -1) user.groups.splice(i, 1, 'nat');
    }

    for (const mode of user.modesInfo) {
        mode.level = 'full';

        user.history.push({
            date: new Date(),
            mode: mode.mode,
            kind: 'left',
            group: user.isNat ? 'bn' : 'nat',
            relatedEvaluation: null,
        });

        user.history.push({
            date: new Date(),
            mode: mode.mode,
            kind: 'joined',
            group: user.isNat ? 'nat' : 'bn',
            relatedEvaluation: null,
        });
    }

    await user.save();

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkGreen,
            description: `Moved [**${user.username}**](http://osu.ppy.sh/users/${user.osuId}) from **${user.isNat ? 'BN' : 'NAT'}** to **${user.isNat ? 'NAT' : 'BN'}**.`,
        }],
        'all'
    );

    res.json({
        user,
        success: 'Changed user group',
    });

    Logger.generate(
        req.session.mongoId,
        `Moved "${user.username}" from "${user.isNat ? 'BN' : 'NAT'}" to "${user.isNat ? 'NAT' : 'BN'}"`,
        'user',
        user._id
    );
});

/* GET aiess info */
router.get('/activity', async (req, res) => {
    let days = parseInt(req.query.days);
    if (isNaN(days)) days = 90;
    else if (days > 1000) days = 999;
    else if (days < 2) days = 2;

    const { osuId, mongoId } = req.query;
    const modes = req.query.modes.split(',');

    const deadline = parseInt(req.query.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - days);
    let maxDate = new Date(deadline);

    res.json(await getGeneralEvents(osuId, mongoId, modes, minDate, maxDate));
});

/* GET modding info */
router.get('/findModsCount/:username', async (req, res) => {
    res.json(await getUserModsCount(req.session.accessToken, req.params.username));
});

/* GET user next evaluation isResignation field */
router.post('/resignFromBn/:id', async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({ error: 'Unauthorized' });
    }

    const evaluation = await ResignationEvaluation.findOne({ user: req.params.id, active: true });

    if (evaluation) {
        return res.json({ error: 'Resignation is currently being handled by the NAT!' });
    }

    await Evaluation.deleteUserActiveEvaluations(user._id);

    let resignations = [];

    for (const mode of user.modes) {
        resignations.push({ user: user._id, mode, deadline: new Date() });
    }

    const evaluations = await ResignationEvaluation.insertMany(resignations);

    for (const evaluation of evaluations) {
        const fields = [];

        const assignedNat = await User.getAssignedNat(evaluation.mode, [user.osuId]);
        evaluation.natEvaluators = assignedNat;
        const natList = assignedNat.map(e => e.username).join(', ');

        fields.push({
            name: 'Assigned NAT',
            value: natList,
        });

        if (await Settings.getModeHasTrialNat(evaluation.mode)) {
            const assignedTrialNat = await User.getAssignedTrialNat(evaluation.mode, [user.osuId]);
            evaluation.bnEvaluators = assignedTrialNat;
            const trialNatList = assignedTrialNat.map(e => e.username).join(', ');

            fields.push({
                name: 'Assigned BN',
                value: trialNatList,
            });
        }

        await evaluation.save();

        await discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(req.session),
                color: discord.webhookColors.white,
                description: `Created [**${user.username}**'s resignation eval](http://bn.mappersguild.com/bneval?id=${evaluation.id})`,
                fields,
            }],
            evaluation.mode
        );
        await util.sleep(500);
    }

    res.json({
        success: 'Your removal will be processed soon',
    });
});

/* POST cycle bag */
router.post('/cycleBag/:mode', middlewares.isResponsibleWithButtons, async (req, res) => {
    const users = await User.getAssignedNat(req.params.mode);

    console.log('---\nfinalusers\n---');

    for (const user of users) {
        console.log(user.username);
    }

    res.json({ success: 'ok' });
});

/* GET additional user BN months (for people who were in NAT but still nominated maps) */
router.post('/:id/findAdditionalBnMonths', async (req, res) => {
    let user = await User.findById(req.params.id);

    res.json(await findAdditionalBnMonths(user));
});

module.exports = router;
