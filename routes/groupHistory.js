const express = require('express');
const middlewares = require('../helpers/middlewares');
const { default: axios } = require('axios');

const router = express.Router();

router.use(middlewares.isLoggedIn);

router.get('/get', async (req, res) => {
    let params = req.query;
    try {
        const response = await axios.get('https://osu.ppy.sh/groups/history', {
            params,
        });
        res.json({ data: response.data });
        
    } catch (error) {
        res.json({ error: 'Something went wrong!' });
    }
});

module.exports = router;
