const config = require('../config.json');
const { default: axios } = require('axios');

async function beatmapsetOwnerMaps(userId) {
    const url = `https://osu.ppy.sh/api/get_beatmaps?k=${config.v1token}&u=${userId}`;

    try {
        const res = await axios.get(url);

        return res.data;
    } catch (error) {
        return { error: 'Something went wrong!' };
    }
}

async function beatmapsetInfo(setId, allDiffs) {
    const url = `https://osu.ppy.sh/api/get_beatmaps?k=${config.v1token}&s=${setId}`;

    try {
        const res = await axios.get(url);

        if (!allDiffs) {
            return res.data[0];
        } else {
            return res.data;
        }
    } catch (error) {
        return { error: 'Something went wrong!' };
    }
}

async function getUserInfoV1(osuId) {
    const url = `https://osu.ppy.sh/api/get_user?k=${config.v1token}&u=${osuId}`;

    try {
        const res = await axios.get(url);

        return res.data[0];
    } catch (error) {
        return { error: 'Something went wrong!' };
    }
}

module.exports = {
    getUserInfoV1,
    beatmapsetInfo,
    beatmapsetOwnerMaps,
};
