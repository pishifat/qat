const express = require('express');
const api = require('../models/api');
const usersService = require('../models/user').service;
const helper = require('../routes/helper');
const aiessService = require('../models/aiess').service;
const config = require('../config.json');
const axios = require('axios');

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    const url = `https://osu.ppy.sh/api/get_beatmaps?k=${config.v1token}&since=2019-04-01`;
    try {
        const res = await axios.get(url);
        let average = 0;
        console.log(res.data[0]);
        for (let i = 0; i < res.data.length; i++) {
            let map = res.data[i];
            average += parseInt(map.hit_length);
        }
        console.log(average/500);
    } catch (error) {
        console.log(error);
    }
    res.render('bnscore', {
        title: 'Beatmap Nominator Score',
        script: '../javascripts/bnScore.js',
        isBnScore: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat',
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    res.json({ r: r });
});

/* POST submit or edit eval */
router.post('/search', async (req, res) => {
    let u = await usersService.query({ username: new RegExp('^' + helper.escapeUsername(req.body.username) + '$', 'i') });
    if (!u) {
        return res.json({ error: 'Cannot find user! Make sure you spelled it correctly' });
    }
    if (u.group == 'user') {
        return res.json({ error: 'User is not a member of the BN/NAT!' });
    }
    let allUserEvents = await aiessService.query({userId: u.osuId}, {}, {}, true);
    let mapIds = [];
    allUserEvents.forEach(event => {
        if(mapIds.indexOf(event.beatmapsetId) == -1){
            mapIds.push(event.beatmapsetId);
        }
    });
    let allRelatedEvents = [];
    for (let i = 0; i < mapIds.length; i++) {
        let mapId = mapIds[i];
        allRelatedEvents.push(await aiessService.query({beatmapsetId: mapId}, {}, {createdAt: 1}, true));
    }
    console.log(allRelatedEvents)
    res.json(allRelatedEvents);
});

module.exports = router;
