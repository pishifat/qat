const express = require('express');
const config = require('../config.json');
const crypto = require('crypto');
const { getUserModsCount } = require('../helpers/scrap');
const middlewares = require('../helpers/middlewares');
const osu = require('../helpers/osu');
const osuBot = require('../helpers/osuBot');
const util = require('../helpers/util');
const User = require('../models/user');
const Logger = require('../models/log');
const ResignationEvaluation = require('../models/evaluations/resignationEvaluation');
const { setSession } = require('../helpers/util');
const { OsuResponseError } = require('../helpers/errors');
const { ResignationConsensus, GenrePreferences, LanguagePreferences, DetailPreferences, OsuStylePreferences, TaikoStylePreferences, CatchStylePreferences, ManiaStylePreferences, ManiaKeymodePreferences, MapperPreferences } = require('../shared/enums');
const Beatmapset = require('../models/modRequests/beatmapset');
const BnFinderMatch = require('../models/bnFinderMatch');

const router = express.Router();

/* GET index bn listing */
router.get('/relevantInfo', async (req, res) => {
    res.json({
        allUsersByMode: await User.getAllByMode(true, true, true),
    });
});

/* GET my info */
router.get('/me', middlewares.isLoggedIn, (req, res) => {
    res.json({
        me: res.locals.userRequest,
    });
});

/* GET mod count from specified user */
router.get('/modsCount/:user/:mode', async (req, res) => {
    const userInput = req.params.user && req.params.user.trim();
    const modeInput = req.params.mode && req.params.mode.trim();

    if (!userInput || !modeInput) {
        return res.json({ error: 'Missing user input' });
    }

    const user = await User.findByUsernameOrOsuId(userInput).select('_id history');
    let months = 3;

    if (user) {
        const wasBn = user.history && user.history.length;
        const lastEvaluation = await ResignationEvaluation
            .findOne({
                user: user._id,
                mode: modeInput,
            })
            .sort({ updatedAt: -1 });

        if (lastEvaluation && lastEvaluation.consensus === ResignationConsensus.ResignedOnGoodTerms) months = 1;
        else if (wasBn) months = 2;
    }

    const modCount = await getUserModsCount(req.session.accessToken, userInput, months);

    if (!modCount.length) {
        return res.json({
            error: `Couldn't calculate your score`,
        });
    }

    return res.json({
        modCount,
        months,
    });
});

/* POST find BNs for BN finder */
router.post('/findBns/', async (req, res) => {
    // set variables
    const url = req.body.url;
    let genres = req.body.genres;
    let languages = req.body.languages;
    let styles = req.body.styles;
    let details = req.body.details;

    // find beatmap and mapper info
    util.isValidUrlOrThrow(url, 'https://osu.ppy.sh/beatmapsets', `Invalid map link`);
    const beatmapsetId = util.getBeatmapsetIdFromUrl(url);

    const beatmapsetInfo = await osu.getBeatmapsetInfo(req.session.accessToken, beatmapsetId);

    if (!beatmapsetInfo || beatmapsetInfo.error || !beatmapsetInfo.id) {
        return res.json({
            error: `Couldn't retrieve beatmap info`,
        });
    }

    // 4 = loved, 3 = qualified, 2 = approved, 1 = ranked, 0 = pending, -1 = WIP, -2 = graveyard
    if (beatmapsetInfo.ranked > 0) {
        return res.json({
            error: `Can't submit ranked maps`,
        });
    }

    const mapperInfo = await osu.getOtherUserInfo(req.session.accessToken, beatmapsetInfo.user.id);

    if (!mapperInfo || mapperInfo.error) {
        return res.json({
            error: `Couldn't retrieve mapper info`,
        });
    }

    if (mapperInfo.id !== req.session.osuId) {
        return res.json({ error: 'You can only submit your own beatmaps' });
    }

    // set beatmap and mapper variables
    const osuGenre = beatmapsetInfo.genre.name.toLowerCase();
    const osuLanguage = beatmapsetInfo.language.name.toLowerCase();
    const beatmapModes = beatmapsetInfo.beatmaps.map(b => b.mode);

    if (beatmapModes.indexOf('fruits') >= 0) {
        const i = beatmapModes.indexOf('fruits');
        beatmapModes.splice(i, 1, 'catch');
    }

    const tempStyles = [];
    if (beatmapModes.includes('osu')) tempStyles.push(OsuStylePreferences);
    if (beatmapModes.includes('taiko')) tempStyles.push(TaikoStylePreferences);
    if (beatmapModes.includes('catch')) tempStyles.push(CatchStylePreferences);
    if (beatmapModes.includes('mania')) tempStyles.push(ManiaStylePreferences);

    let mapperExperience = mapperInfo.ranked_and_approved_beatmapset_count >= 3 ? ['experienced mapper'] : ['new mapper'];

    if (!genres.includes(osuGenre)) {
        genres.push(osuGenre);
    }

    if (!languages.includes(osuLanguage)) {
        languages.push(osuLanguage);
    }

    // find matching users

    const finalUsers = [];

    const users = await User.find({
        groups: { $in: ['nat', 'bn'] },
        'modesInfo.mode': { $in: beatmapModes },
    });

    for (let step = 0; step <= 5 && finalUsers.length < 5; step++) {
        users.sort( () => .5 - Math.random() );

        const filteredUsers = users.filter(u => {
            return (
                (u.genrePreferences && u.genrePreferences.length) ||
                (u.languagePreferences && u.languagePreferences.length) ||
                (u.osuStylePreferences && u.osuStylePreferences.length) ||
                (u.taikoStylePreferences && u.taikoStylePreferences.length) ||
                (u.catchStylePreferences && u.catchStylePreferences.length) ||
                (u.maniaStylePreferences && u.maniaStylePreferences.length) ||
                (u.maniaKeymodePreferences && u.maniaKeymodePreferences.length) ||
                (u.detailPreferences && u.detailPreferences.length) ||
                (u.mapperPreferences && u.mapperPreferences.length)
            );
        });

        for (let i = 0; i < filteredUsers.length; i++) {
            const user = filteredUsers[i];
            filteredUsers[i].genreCount = 0;
            filteredUsers[i].languageCount = 0;
            filteredUsers[i].styleCount = 0;
            filteredUsers[i].detailCount = 0;
            filteredUsers[i].mapperExperienceCount = 0;

            for (const genre of genres) {
                if (user.genrePreferences.includes(genre)) filteredUsers[i].genreCount += 5;
            }

            for (const language of languages) {
                if (user.languagePreferences.includes(language)) filteredUsers[i].languageCount += 3;
            }

            for (const style of styles) {
                if (user.modes.includes('osu') && beatmapModes.includes('osu') && user.osuStylePreferences.includes(style)) filteredUsers[i].styleCount += 2;
                if (user.modes.includes('taiko') && beatmapModes.includes('taiko') && user.taikoStylePreferences.includes(style)) filteredUsers[i].styleCount += 2;
                if (user.modes.includes('catch') && beatmapModes.includes('catch') && user.catchStylePreferences.includes(style)) filteredUsers[i].styleCount += 2;
                if (user.modes.includes('mania') && beatmapModes.includes('mania') && user.maniaStylePreferences.includes(style)) filteredUsers[i].styleCount += 2;

                if (user.modes.includes('mania') && beatmapModes.includes('mania') && user.maniaKeymodePreferences.includes(style)) {
                    filteredUsers[i].styleCount += 2;
                } else {
                    filteredUsers[i].styleCount -= 10;
                }
            }

            for (const detail of details) {
                if (user.detailPreferences.includes(detail)) filteredUsers[i].detailCount += 1;
            }

            for (const experience of mapperExperience) {
                if (user.mapperPreferences.includes(experience)) filteredUsers[i].mapperExperienceCount += 3;
            }

            filteredUsers[i].totalPreferenceCount = filteredUsers[i].genreCount + filteredUsers[i].languageCount + filteredUsers[i].styleCount + filteredUsers[i].detailCount + filteredUsers[i].mapperExperienceCount;
        }

        filteredUsers.sort((a, b) => {
            if (a.totalPreferenceCount > b.totalPreferenceCount) return -1;
            if (a.totalPreferenceCount < b.totalPreferenceCount) return 1;

            return 0;
        });

        const finalUserIds = finalUsers.map(u => u.id);

        for (let i = 0; i < filteredUsers.length && finalUsers.length < 5; i++) {
            const user = filteredUsers[i];

            if (!finalUserIds.includes(user.id)) {
                finalUsers.push(user);
            }
        }

        let tempStyles = [];

        switch (step) {
            case 0:
                details = DetailPreferences;
                break;
            case 1:
                styles = [...new Set(tempStyles)];
                break;
            case 2:
                mapperExperience = MapperPreferences;
                break;
            case 3:
                languages = LanguagePreferences;
                break;
            default:
                genres = GenrePreferences;
                break;
        }
    }

    let beatmapset;
    let alreadySubmitted = false;

    let existingBeatmapset = await Beatmapset.findOne({ osuId: parseInt(beatmapsetId) });

    if (existingBeatmapset) {
        beatmapset = existingBeatmapset;

        const existingMatch = await BnFinderMatch.findOne({ beatmapset: beatmapset._id });

        if (existingMatch) {
            alreadySubmitted = true;
        }
    } else {
        beatmapset = new Beatmapset();
        beatmapset.osuId = beatmapsetInfo.id;
        beatmapset.artist = beatmapsetInfo.artist;
        beatmapset.title = beatmapsetInfo.title;
        beatmapset.modes = beatmapModes;
        beatmapset.genre = beatmapsetInfo.genre.name.toLowerCase();
        beatmapset.language = beatmapsetInfo.language.name.toLowerCase();
        beatmapset.numberDiffs = beatmapsetInfo.beatmaps.length;
        beatmapset.length = beatmapsetInfo.beatmaps[0].total_length;
        beatmapset.bpm = beatmapsetInfo.bpm;
        beatmapset.submittedAt = beatmapsetInfo.submitted_date;
        beatmapset.mapperUsername = mapperInfo.username;
        beatmapset.mapperOsuId = mapperInfo.id;

        await beatmapset.validate();
        await beatmapset.save();
    }

    if (!alreadySubmitted) {
        for (const user of finalUsers) {
            const match = new BnFinderMatch();
            match.user = user._id;
            match.beatmapset = beatmapset._id;
            match.genres = req.body.genres;
            match.languages = req.body.languages;
            match.styles = req.body.styles;
            match.details = req.body.details;
            match.mapperExperience = mapperInfo.ranked_and_approved_beatmapset_count >= 3 ? 'experienced mapper' : 'new mapper';

            await match.validate();
            await match.save();
        }
    }

    if (!finalUsers.length) {
        return res.json({ error: 'No BNs matching your criteria could be found :( Try again later.' });
    }

    return res.json(finalUsers);
});

/* GET next match from BN Finder */
router.get('/findNextMatch', async (req, res) => {
    const match = await BnFinderMatch
        .findOne({
            user: req.session.mongoId,
            isMatch: { $exists: false },
            isExpired: { $ne: true },
        })
        .populate('beatmapset')
        .sort({ createdAt: 1 });

    if (!match) {
        return res.json('no match');
    }

    return res.json(match);
});

/* POST set match status */
router.post('/setMatchStatus/:id', async (req, res) => {
    const match = await BnFinderMatch.findByIdAndUpdate(req.params.id, { isMatch: req.body.status }).populate('beatmapset user');

    let messages = [];

    if (req.body.status == true) {
        messages.push(`hello! ${req.session.username} ( https://osu.ppy.sh/users/${req.session.osuId} ) expressed interest your beatmap "${match.beatmapset.fullTitle}"!`, `send them a message if they haven't modded your map already! :)`);
    } else {
        messages.push(`hello! ${req.session.username} ( https://osu.ppy.sh/users/${req.session.osuId} ) wasn't interested in your beatmap "${match.beatmapset.fullTitle}".`, `send them a message if you'd like more feedback. :)`);
    }

    messages.push(`—BN Finder`);

    const sentMessages = await osuBot.sendMessages(match.user.osuId, messages);

    if (sentMessages !== true) {
        return res.json({ error: `Messages were not sent. Please let pishifat know!` });
    }

    return res.json({ success: 'Mapper has been notified!' });
});

/* GET 'login' to get user's info */
router.get('/login', (req, res) => {
    const state = crypto.randomBytes(48).toString('base64');

    req.session._state = {
        state,
        redirectUrl: req.get('referer'),
    };

    res.redirect(
        'https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=' + config.oauth.id +
        '&redirect_uri=' + encodeURIComponent(config.oauth.redirect) +
        '&state=' + encodeURIComponent(state) +
        '&scope=identify+public'
    );
});

/* GET destroy session */
router.get('/logout', async (req, res) => {
    await req.session.destroy();
    res.redirect('/');
});

/* GET user's token and user's info to login */
router.get('/callback', async (req, res) => {
    if (!req.query.code || req.query.error) {
        return res.status(500).render('error', { message: req.query.error || 'Something went wrong' });
    }

    const decodedState = decodeURIComponent(req.query.state);
    const savedState = {
        ...req.session._state,
    };
    req.session._state = undefined;

    if (decodedState !== savedState.state) {
        return res.status(403).render('error', { message: 'unauthorized' });
    }

    let response = await osu.getToken(req.query.code);

    if (response.error) {
        throw new OsuResponseError(response, 'Error on getting token');
    } else {
        setSession(req.session, response);
        response = await osu.getUserInfo(req.session.accessToken);

        if (response.error) {
            req.session.destroy();
            throw new OsuResponseError(response, 'Error on getting user info');
        }

        const groupIds = response.groups.map(g => g.id);
        const groups = ['user'];

        if (groupIds.includes(7)) {
            groups.push('nat');
        }

        if (groupIds.includes(28) || groupIds.includes(32)) {
            groups.push('bn');
        }

        if (groupIds.includes(4) || groupIds.includes(11)) {
            groups.push('gmt');
        }

        const osuId = response.id;
        const username = response.username;
        const rankedBeatmapsets = response.ranked_and_approved_beatmapset_count;
        const user = await User.findOne({ osuId });

        if (!user) {
            const newUser = new User();
            newUser.osuId = osuId;
            newUser.username = username;
            newUser.groups = groups;
            newUser.rankedBeatmapsets = rankedBeatmapsets;
            await newUser.save();

            req.session.mongoId = newUser._id;
            Logger.generate(
                req.session.mongoId,
                'Verified their account for the first time',
                'account',
                req.session.mongoId
            );
        } else {
            if (user.username != username) {
                Logger.generate(
                    user._id,
                    `Username changed from "${user.username}" to "${response.username}"`,
                    'account',
                    user._id
                );

                user.username = username;
                await user.save();
            }

            if (user.rankedBeatmapsets != rankedBeatmapsets) {
                user.rankedBeatmapsets = rankedBeatmapsets;
                await user.save();
            }

            if (groups.some(g => !user.groups.includes(g)) || user.groups.some(g => !groups.includes(g))) {
                if (!user.groups.includes('gmt') && groups.includes('gmt')) {
                    Logger.generate(
                        user._id,
                        `User toggled on spectator role`,
                        'account',
                        user._id
                    );
                }

                user.groups = groups;
                await user.save();
                Logger.generate(
                    user._id,
                    `User groups changed to ${groups.join(', ')}`,
                    'account',
                    user._id
                );
            }

            req.session.mongoId = user._id;
        }

        req.session.osuId = osuId;
        req.session.username = username;

        res.redirect(savedState.redirectUrl || '/');
    }
});

module.exports = router;
