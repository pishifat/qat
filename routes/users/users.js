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
const { BnEvaluationConsensus, BnEvaluationAddition, AppEvaluationConsensus } = require('../../shared/enums');
const { websocketManager } = require("../../helpers/websocket");

const router = express.Router();

const evaluationsPopulate = [
    {
        path: 'reviews',
        select: 'evaluator createdAt',
        populate: {
            path: 'evaluator',
            select: 'username osuId',
        },
    },
    {
        path: 'user',
        select: 'username osuId',
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

/* GET NAT list */
router.get('/loadNatInMode/:mode', middlewares.isLoggedIn, middlewares.isNatOrTrialNat, async (req, res) => {
    console.log('in');
    console.log('???');
    const users = await User.find({ groups: 'nat', 'modesInfo.mode': req.params.mode }).sort({ username: 1 });

    console.log(users);

    res.json(users);
});

/* GET users banned from BN */
router.get('/loadBannedUsers', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const users = await User.find({
        isBannedFromBn : true,
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
    let eval = await BnEvaluation
        .findOne({ user: req.params.id, mode: req.params.mode, active: true })
        .select('reviews deadline discussion consensus active');

    if (!eval) {
        const user = await User.findById(req.params.id);

        if (user && user.modesInfo[0].mode == 'none' && !user.modesInfo[1]) {
            const noModeEvaluationRound = await BnEvaluation
                .findOne({ user: req.params.id, active: true })
                .select('reviews deadline discussion consensus active');

            if (!noModeEvaluationRound) {
                return res.json({ deadline: 'Never' });
            }

            eval = noModeEvaluationRound;
        }
    }

    eval = eval.toJSON();
    eval.consensus = eval.consensus && eval.consensus.length ? 'fuck you' : undefined;

    res.json(eval);
});

/* POST adjust next evaluation deadline */
router.post('/adjustEvaluationDeadline/:id/:mode', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
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
router.post('/resetEvaluationDeadline/:id/:mode', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
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
            .populate({
                path: "user",
                select: "username",
            })
            .sort({ archivedAt: -1 }),

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
        deadline.setDate(deadline.getDate() + 37);

        if (pendingEvaluation) {
            pendingEvaluation.deadline = deadline;
            await pendingEvaluation.save();
        } else {
            await BnEvaluation.create({
                user: evaluation.user,
                mode: evaluation.mode,
                deadline,
                activityToCheck: 37,
            });
        }
    } else if (evaluation.consensus === BnEvaluationConsensus.FullBn) {
        let activityToCheck = 90;

        if (evaluation.addition === BnEvaluationAddition.LowActivityWarning) {
            deadline.setDate(deadline.getDate() + 37); // +37 days
        } else {
            const random90 = Math.round(Math.random() * (95 - 85) + 85); // between 85 and 95 days
            deadline.setDate(deadline.getDate() + random90);
            activityToCheck = random90;
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

    res.json({ deadline });

    Logger.generate(
        req.session.mongoId,
        `Reset ${evaluation?.user.username}'s ${mode} current BN evaluation deadline to ${deadline.toISOString().slice(0, 10)}`,
        'bnEvaluation',
        pendingEvaluation?._id || evaluation?.user._id
    );
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
/* GET gmt activity */
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
                updatedAt: { $gt: minDate },
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

/* GET vibe check stats */
router.get('/findVibeCheckStats', middlewares.isLoggedIn, middlewares.isAdmin, async (req, res) => {
    const apps = await AppEvaluation
        .find({ 
            vibeChecks: { $exists: true, $ne: [] },
            consensus: { $exists: true },
            active: false,
        })
        .populate([
            { 
                path: 'vibeChecks',
                select: 'mediator vote',
                populate: {
                    path: 'mediator',
                    select: 'username osuId groups',
                },
            },
        ]);

    const users = [];

    for (const app of apps) {
        for (const vibeCheck of app.vibeChecks) {
            // add user if they don't exist yet
            if (!users.find(u => u.osuId == vibeCheck.mediator.osuId)) {
                users.push({
                    username: vibeCheck.mediator.username,
                    osuId: vibeCheck.mediator.osuId,
                    isNat: vibeCheck.mediator.groups.includes('nat'),
                    correct: 0,
                    incorrect: 0,
                    positiveVibes: 0,
                    negativeVibes: 0,
                    accuracy: 0,
                });
            }

            // count vibes
            const i = users.findIndex(u => u.osuId == vibeCheck.mediator.osuId);

            if (vibeCheck.vote == 1 && app.consensus == AppEvaluationConsensus.Pass) {
                users[i].correct++;
                users[i].positiveVibes++;
            } else if (vibeCheck.vote == 1 && app.consensus == AppEvaluationConsensus.Fail) {
                users[i].incorrect++;
                users[i].positiveVibes++;
            } else if (vibeCheck.vote == 3 && app.consensus == AppEvaluationConsensus.Pass) {
                users[i].incorrect++;
                users[i].negativeVibes++;
            } else if (vibeCheck.vote == 3 && app.consensus == AppEvaluationConsensus.Fail) {
                users[i].correct++;
                users[i].negativeVibes++;
            }
        }
    }

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const total = user.correct + user.incorrect;
        const accuracy = user.correct/total;
        users[i].accuracy = Math.round(accuracy * 100);
    }

    res.json(users);
});

/* POST update discord ID */
router.post('/updateDiscordId', middlewares.isLoggedIn, middlewares.hasFullReadAccessOrTrialNat, async (req, res) => {
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
        discordId: user.discordId
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" discord ID to ${user.discordId}`,
        'user',
        user._id
    );
});

/* POST switch bn evaluator */
router.post('/:id/switchBnEvaluator', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.isBnEvaluator = !user.isBnEvaluator;
    await user.save();

    if(res.locals.userRequest.isNat) {
        user.modes.forEach(async mode => {
            await discord.webhookPost(
                [{
                    author: discord.defaultWebhookAuthor(req.session),
                    color: discord.webhookColors.orange,
                    description: `Toggled **${user.isBnEvaluator ? "on" : "off"}** ${user.isBn ? "mock evaluations" : "evaluations"} for [**${user.username}**](https://osu.ppy.sh/users/${user.osuId})`,
                }],
                mode
            );
            await util.sleep(500);
        });
    }

    res.json({
        user,
        success: 'Toggled mock evaluations',
    });

    Logger.generate(
        req.session.mongoId,
        `Opted "${user.username}" ${user.isBnEvaluator ? 'in to' : 'out of'} mock evaluations`,
        'user',
        user._id
    );
});

/* POST toggle showExplicitContent */
router.post('/:id/toggleShowExplicitContent', middlewares.isLoggedIn, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.showExplicitContent = !user.showExplicitContent;
    await user.save();

    res.json({
        user,
        success: 'Toggled explicit content',
    });

    Logger.generate(
        req.session.mongoId,
        `Toggled "${user.username}" ${user.showExplicitContent ? 'on' : 'off'} for show explicit content setting`,
        'user',
        user._id
    );
});

/* POST toggle isActiveContentReviewer */
router.post('/:id/toggleIsActiveContentReviewer', middlewares.isLoggedIn, middlewares.hasFullReadAccess, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.hasFullReadAccess) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.isActiveContentReviewer = !user.isActiveContentReviewer;
    await user.save();

    res.json({
        user,
        success: 'Toggled content review pings',
    });

    Logger.generate(
        req.session.mongoId,
        `Opted "${user.username}" ${user.showExplicitContent ? 'in' : 'out of'} content review pings`,
        'user',
        user._id
    );
});

/* POST switch/update request status */
router.post('/:id/updateRequestStatus', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    if (req.body.requestLink) {
        util.isValidUrlOrThrow(req.body.requestLink);
    }

    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    // Send websocket notification + update lastOpenedForRequests if request status has changed
    if (user.requestStatus.filter((s) => s == "closed").length != req.body.requestStatus.filter((s) => s == "closed").length) {
        websocketManager.sendNotification("users:request_status_update", {
            isOpen: !req.body.requestStatus.includes("closed"),
            user: user
        });

        user.lastOpenedForRequests = new Date();
    }
    
    user.requestStatus = req.body.requestStatus;
    user.requestLink = req.body.requestLink;
    await user.save();

    res.json({
        success: 'Updated request status',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `Updated "${user.username}" status to ${user.requestStatus} (${req.body.requestStatus.includes("closed") ? "closed" : "open"}) (${user.requestLink || 'No link'})`,
        'user',
        user._id
    );
});

/* POST update languages */
router.post('/:id/updateLanguages', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id && !res.locals.userRequest.isNat) {
        return res.json({
            error: 'Unauthorized',
        });
    }
    
    const language = req.body.language;

    const i = user.languages.indexOf(language);

    if (i == -1) {
        user.languages.push(language);
    } else {
        user.languages.splice(i, 1);
    }

    await user.save();

    res.json({
        success: 'Updated',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `${i == -1 ? 'Added ' + language + ' to' : 'Removed ' + language + ' from'} "${user.username}"'s language list`,
        'user',
        user._id
    );
});

/* POST update genre preferences */
router.post('/:id/updateGenrePreferences', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const genre = req.body.genre;
    const isPreference = req.body.isPreference;

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
router.post('/:id/updateLanguagePreferences', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const language = req.body.language;
    const isPreference = req.body.isPreference;

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
router.post('/:id/updateStylePreferences/:mode', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
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
router.post('/:id/updateKeymodePreferences', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const keymode = req.body.keymode;
    const isPreference = req.body.isPreference;

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
router.post('/:id/updateDetailPreferences', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const detail = req.body.detail;
    const isPreference = req.body.isPreference;

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
router.post('/:id/updateMapperPreferences', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const mapper = req.body.mapper;
    const isPreference = req.body.isPreference;

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

/* POST add to NAT */
router.post('/:id/addToNat', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();
    const mode = req.body.mode;
    let isFormer = false;

    if (!mode)
        return res.json({
            error: 'You must select a game mode!',
        });

    await Evaluation.deleteUserActiveEvaluations(user._id, mode);
    user.isTrialNat = false;
    const i = user.groups.findIndex(g => g === 'bn');
    if (i !== -1) user.groups.splice(i, 1, 'nat');
    else {
        user.groups.push('nat');
        isFormer = true;
    }
    

    for (let i = 0; i < user.modesInfo.length; i++) {
        if (user.modesInfo[i].mode == mode) {
            user.modesInfo[i].level = 'evaluator';
        }
    }

    if (!user.modesInfo.length) {
        user.modesInfo.push({
            mode: mode,
            level: 'evaluator',
        })
    }

    const activityToCheck = Math.floor(Math.random() * (80 - 70) + 70); // between 70 and 80 days;
    let deadline = new Date();
    deadline.setDate(deadline.getDate() + activityToCheck);

    await BnEvaluation.create({
        user: user._id,
        mode,
        deadline,
        activityToCheck,
    });
    
    if (!isFormer) 
        user.history.push({
            date: new Date(),
            mode,
            kind: 'left',
            group: 'bn',
            relatedEvaluation: null,
        });

    user.history.push({
        date: new Date(),
        mode,
        kind: 'joined',
        group: 'nat',
        relatedEvaluation: null,
    });

    await user.save();

    await util.invalidateSessions(user.id);

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkGreen,
            description: `Moved [**${user.username}**](http://osu.ppy.sh/users/${user.osuId}) to **NAT** (${util.formatMode(mode)})`,
        }],
        'all'
    );

    res.json({
        user,
        success: 'Added to NAT',
    });

    Logger.generate(
        req.session.mongoId,
        `Moved "${user.username}" from "${user.isNat ? 'BN' : 'NAT'}" to "${user.isNat ? 'NAT' : 'BN'}"`,
        'user',
        user._id
    );
});

/* POST change evaluator mode */
router.post('/:id/changeEvaluatorMode', middlewares.isLoggedIn, middlewares.isNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();
    const mode = req.body.mode;
    let oldMode = '';

    if (!mode)
        return res.json({
            error: 'You must select a game mode!',
        });

    for (let i = 0; i < user.modesInfo.length; i++) {
        if (user.modesInfo[i].level == 'evaluator') {
            oldMode = user.modesInfo[i].mode;
            user.modesInfo[i].mode = mode;
        }
    }
    
    user.modes = [mode];
    user.evaluatorModes = [mode];

    await user.save();

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkGreen,
            description: `Moved [**${user.username}**](http://osu.ppy.sh/users/${user.osuId}) from **${util.formatMode(oldMode)}** to **${util.formatMode(mode)}** NAT`,
        }],
        'all'
    );

    res.json({
        user,
        success: 'Changed NAT responsibility',
    });

    Logger.generate(
        req.session.mongoId,
        `Moved "${user.username}" from "${util.formatMode(oldMode)} NAT" to "${util.formatMode(mode)} NAT"`,
        'user',
        user._id
    );
});

/* POST force move from probation to full BN */
router.post('/:id/forceFullBn', middlewares.isLoggedIn, middlewares.isAdmin, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();
    const mode = req.body.mode;

    if (!mode)
        return res.json({
            error: 'Failed to get game mode!',
        });
    
    for (const modeInfo of user.modesInfo) {
        if (modeInfo.mode == mode) {
            modeInfo.level = 'full';
        }
    }

    const [evaluation, pendingEvaluation] = await Promise.all([
        AppEvaluation
            .findOne({
                user,
                mode,
                consensus: 'pass',
                active: false,
            })
            .sort({ archivedAt: -1 }),

        BnEvaluation
            .findOne({
                user,
                mode,
                active: true,
            }),
    ]);

    let deadline = new Date(evaluation.archivedAt);
    deadline.setDate(deadline.getDate() + 90);

    if (pendingEvaluation) {
        pendingEvaluation.deadline = deadline;
        await pendingEvaluation.save();
    } else {
        await BnEvaluation.create({
            user,
            mode,
            deadline,
            activityToCheck: 90,
        });
    }

    await user.save();

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.darkGreen,
            description: `Force moved [**${user.username}**](http://osu.ppy.sh/users/${user.osuId}) to **full BN**`,
        }],
        mode
    );

    res.json({
        user,
        success: 'Force moved to full BN',
    });

    Logger.generate(
        req.session.mongoId,
        `Force moved "${user.username}" to full BN`,
        'user',
        user._id
    );
});


/* GET aiess info */
router.get('/activity', async (req, res) => {
    let days = parseInt(req.query.days);
    if (isNaN(days)) days = 90;
    else if (days > 10000) days = 9999;
    else if (days < 2) days = 2;

    const { osuId, mongoId } = req.query;
    const modes = req.query.modes.split(',');

    const deadline = parseInt(req.query.deadline);
    let minDate = new Date(deadline);
    minDate.setDate(minDate.getDate() - days);
    let maxDate = new Date(deadline);

    // find all AppEvaluations & BnEvaluations/Resignations for NAT
    let [appEvaluations, bnEvaluations] = await Promise.all([
        AppEvaluation
            .find({
                createdAt: { $gt: minDate },
                mode: { $in: modes },
                active: false,
                bnEvaluators: { $ne: mongoId },
            })
            .populate(evaluationsPopulate)
            .select('-feedback -id -_id -mods -reasons -oszs -bnEvaluators -user')
            .sort({ deadline: 1 }),

        Evaluation
            .find({
                deadline: { $gt: minDate },
                mode: { $in: modes },
                active: false,
            })
            .populate(evaluationsPopulate)
            .select('-feedback -id -_id -user')
            .sort({ deadline: 1 }),
    ]);

    // extract apps that user evaluated
    appEvaluations = appEvaluations.filter(a => 
        a.reviews.some(r => r.evaluator.id == mongoId)
    );

    // extract BnEvaluations/Resignations that user evaluated
    bnEvaluations = bnEvaluations.filter(e =>
        e.reviews.some(r => r.evaluator.id == mongoId)
    );

    res.json({
        ...await getGeneralEvents(osuId, mongoId, modes, minDate, maxDate),
        appEvaluations,
        bnEvaluations,
    });
});

/* GET modding info */
router.get('/findModsCount/:username', async (req, res) => {
    res.json(await getUserModsCount(req.session.accessToken, req.params.username));
});

/* GET user next evaluation isResignation field */
router.post('/resignFromBn/:id', async (req, res) => {
    const user = await User.findById(req.params.id).orFail();
    const mode = req.body.mode;

    if (req.session.mongoId != user.id) {
        return res.json({ error: 'Unauthorized' });
    }

    const evaluation = await ResignationEvaluation.findOne({ user: user._id, mode, active: true });

    if (evaluation) {
        return res.json({ error: 'Resignation is currently being handled by the NAT!' });
    }

    await Evaluation.deleteUserActiveEvaluations(user._id, mode);

    let resignation = new ResignationEvaluation();
    resignation.user = user._id;
    resignation.mode = mode;
    resignation.deadline = new Date();

    const fields = [];

    const assignedNat = await User.getAssignedNat(mode, req.session.mongoId, [user.osuId]);
    resignation.natEvaluators = assignedNat;
    const natList = assignedNat.map(e => e.username).join(', ');

    fields.push({
        name: 'Assigned NAT',
        value: natList,
    });

    let discordIds = assignedNat.map(e => e.discordId).filter(e => e);

    if (await Settings.getModeHasTrialNat(mode)) {
        const assignedTrialNat = await User.getAssignedTrialNat(mode, [user.osuId]);
        resignation.bnEvaluators = assignedTrialNat;
        const trialNatList = assignedTrialNat.map(e => e.username).join(', ');

        fields.push({
            name: 'Assigned BN',
            value: trialNatList,
        });

        discordIds = discordIds.concat(assignedTrialNat.map(e => e.discordId).filter(e => e));
    }

    await resignation.save();

    await discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(req.session),
            color: discord.webhookColors.white,
            description: `Created [**${user.username}**'s resignation eval](http://bn.mappersguild.com/bneval?id=${resignation.id})`,
            fields,
        }],
        mode
    );
    await util.sleep(500);

    await discord.userHighlightWebhookPost(mode, discordIds);

    res.json({
        success: 'Your resignation will be processed soon',
    });
});

/* POST cycle bag */
router.post('/cycleBag/:mode', middlewares.isLoggedIn, middlewares.isAdmin, async (req, res) => {
    const tempEvaluation = await BnEvaluation.findOne({ active: true }); // a random eval for getAssignedNat to work
    const users = await User.getAssignedNat(req.params.mode, tempEvaluation.user.toString());

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

/* POST update request info */
router.post('/:id/updateRequestInfo', async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    user.requestInfo = req.body.requestInfo;
    await user.save();

    res.json({
        success: 'Updated',
        user,
    });

    Logger.generate(
        req.session.mongoId,
        `User "${user.username}" updated their request info`,
        'user',
        user._id
    );
});

/* POST toggle eval visibility */
router.post('/toggleEvalVisibility/:id', async (req, res) => {
    let isApp = true;
    let eval = await AppEvaluation
        .findById(req.params.id)
        .populate(evaluationsPopulate);
    
    if (!eval) {
        isApp = false;
        eval = await BnEvaluation
            .findById(req.params.id)
            .populate(evaluationsPopulate);
    }

    if (!eval) {
        return res.json({
            error: 'Evaluation not found',
        });
    }

    //check eval ownership
    if (req.session.mongoId != eval.user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    // disallow editing nat evals
    if (eval.isNatEvaluation) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    eval.isPublic = req.body.isPublic;
    await eval.save();

    res.json({ isPublic: eval.isPublic });

    Logger.generate(
        req.session.mongoId,
        `Changed visibility of ${eval.user.username}'s ${eval.mode} ${isApp ? 'BN app' : 'current BN eval'} to "${eval.isPublic ? 'public' : 'private'}"`,
        isApp ? 'appEvaluation' : 'bnEvaluation',
        eval._id
    );
});

/* POST toggle subjectiveEvalFeedback */
router.post('/:id/toggleSubjectiveEvalFeedback', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    const user = await User.findById(req.params.id).orFail();

    if (req.session.mongoId != user.id) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    // osu! only
    if (!user.isBnFor('osu')) {
        return res.json({
            error: 'only osu! BNs can do this.',
        });
    }

    user.subjectiveEvalFeedback = !user.subjectiveEvalFeedback;
    await user.save();

    res.json({
        user,
        success: 'Toggled receiving subjective eval feedback!',
    });

    Logger.generate(
        req.session.mongoId,
        `Opted "${user.username}" ${user.showExplicitContent ? 'in' : 'out of'} receiving subjective eval feedback`,
        'user',
        user._id
    );
});

/* GET get unique mapper stats */
router.get('/getUniqueMapperStats', middlewares.isLoggedIn, middlewares.isAdmin, async (req, res) => {
    const minDate = new Date(req.query.date);
    const maxDate = new Date();

    if (isNaN(minDate.getTime())) {
        return res.json({
            error: 'Invalid date',
        });
    }

    // get nominate or qualify events
    const events = await Aiess
        .find({ timestamp: { $gte: minDate, $lte: maxDate }, type: { $in: ['nominate', 'qualify'] } })

    // parse mode stats
    // get unique nominations and mappers for each mode
    let modeStats = [];
    const modes = ['osu', 'taiko', 'catch', 'mania'];

    for (const mode of modes) {
        const modeEvents = events.filter(e => e.modes == mode);
        const uniqueNominations = new Set(modeEvents.map(e => e.beatmapsetId));
        const uniqueMappers = new Set(modeEvents.map(e => e.creatorId));

        modeStats.push({
            mode,
            uniqueNominations: uniqueNominations.size,
            uniqueMappers: uniqueMappers.size,
            uniqueMappersPercentage: Math.round(uniqueMappers.size / uniqueNominations.size * 100),
        });
    }

    
    // parse nominator stats
    const uniqueNominators = new Set(events.map(e => e.userId).filter(e => e));

    let nominatorStats = [];

    for (const nominatorId of uniqueNominators) {
        const nominatorEvents = events.filter(e => e.userId == nominatorId);
        const uniqueNominations = new Set(nominatorEvents.map(e => e.beatmapsetId));
        const uniqueMappers = new Set(nominatorEvents.map(e => e.creatorId));
        const nominator = await User.findOne({ osuId: nominatorId });

        nominatorStats.push({
            username: nominator.username,
            userId: nominator.osuId,
            modes: nominator.modes.length ? nominator.modes : ['resigned'],
            uniqueNominationCount: uniqueNominations.size,
            uniqueMapperCount: uniqueMappers.size,
            uniqueMappersPercentage: Math.round(uniqueMappers.size / uniqueNominations.size * 100),
        });
    }

    nominatorStats.sort((a, b) => b.uniqueNominationCount - a.uniqueNominationCount);

    res.json({
        modeStats,
        nominatorStats,
    });
});

module.exports = router;
