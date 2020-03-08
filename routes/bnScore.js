const express = require('express');
const api = require('../helpers/api');
const User = require('../models/user');
const helper = require('../helpers/helpers');
const aiessService = require('../models/aiess').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('bnscore', {
        title: 'Beatmap Nominator Score',
        script: '../javascripts/bnScore.js',
        isBnScore: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', (req, res) => {
    res.json({});
});

/* POST submit or edit eval */
router.post('/search', async (req, res) => {
    let u = await User.findByUsername(req.body.username);

    if (!u) {
        return res.json({ error: 'Cannot find user! Make sure you spelled it correctly' });
    }

    if (u.group == 'user') {
        return res.json({ error: 'User is not a member of the BN/NAT!' });
    }

    let allUserEvents = await aiessService.query({ userId: u.osuId, $or: [{ eventType: 'Bubbled' }, { eventType: 'Qualified' }] }, {}, { timestamp: 1 }, true);
    let mapIds = [];
    allUserEvents.forEach(event => {
        if (mapIds.indexOf(event.beatmapsetId) == -1) {
            mapIds.push(event.beatmapsetId);
        }
    });
    let allRankedEvents = [];

    for (let i = 0; i < mapIds.length; i++) {
        let mapId = mapIds[i];
        allRankedEvents.push(await aiessService.query({ beatmapsetId: mapId, eventType: 'Ranked' }, {}, { timestamp: 1 }, true));
    }

    let uniqueUsers = [];

    for (let i = 0; i < allRankedEvents.length; i++) {
        let eventGroup = allRankedEvents[i];

        for (let j = 0; j < eventGroup.length; j++) {
            let event = eventGroup[j];
            let mapperId = event.mapperId;

            if (!event.mapperId) {
                let bmInfo = await api.beatmapsetInfo(event.beatmapsetId, true);

                mapperId = parseInt(bmInfo[0].creator_id);
                await aiessService.update(event.id, { mapperId });

                let effort = 0;
                bmInfo.forEach(diff => {
                    let drain = diff.hit_length;
                    let difficulty = diff.difficultyrating;
                    effort += (0.1*difficulty + 0.5)*(0.00385*drain + 0.5);
                });
                await aiessService.update(event.id, { effortBonus: effort });

                let u = await User.findOne({ osuId: mapperId });

                if (u && u.group != 'user') {
                    await aiessService.update(event.id, { isBnOrNat: true });
                }

                let userMaps = await api.beatmapsetOwnerMaps(mapperId);
                let uniqueMapIds = [];
                userMaps.forEach(map => {
                    if (map.approved_date && uniqueMapIds.indexOf(map.beatmapset_id) == -1) {
                        uniqueMapIds.push(map.beatmapset_id);
                    }
                });
                await aiessService.update(event.id, { mapperTotalRanked: uniqueMapIds.length });
            }

            let uniqueMapperThreshold = new Date();
            uniqueMapperThreshold.setDate(uniqueMapperThreshold.getDate() - 90);

            if (uniqueMapperThreshold < event.timestamp && uniqueUsers.indexOf(mapperId) == -1) {
                if (!event.mapperId) {
                    await aiessService.update(event.id, { isUnique: true });
                }

                uniqueUsers.push(mapperId);
            }
        }
    }

    let allRelatedEvents = [];

    for (let i = 0; i < mapIds.length; i++) {
        let mapId = mapIds[i];
        allRelatedEvents.push(await aiessService.query({ beatmapsetId: mapId }, {}, { timestamp: 1 }, true));
    }

    res.json({ events: allRelatedEvents, user: u });
});

module.exports = router;
