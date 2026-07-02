const express = require('express');
const middlewares = require('../helpers/middlewares');
const discussionsService = require('../services/discussionsService');

const router = express.Router();

router.use(middlewares.isLoggedIn);

router.post('/submit', middlewares.hasBasicAccess, async (req, res) => {
    try {
        const result = await discussionsService.submitDiscussion(req.body, req.session, res.locals.userRequest);
        if (result.error) {
            return res.json({ error: result.error });
        }
        res.json(result);
    } catch (error) {
        res.json({ error: error.message || 'Failed to submit discussion' });
    }
});

router.post('/submitMediation/:id', middlewares.hasBasicAccess, async (req, res) => {
    const result = await discussionsService.submitMediation(
        req.params.id,
        req.body,
        req.session,
        res.locals.userRequest
    );
    if (result.error) {
        return res.json({ error: result.error });
    }
    res.json(result);
});

router.post('/concludeMediation/:id', middlewares.hasFullReadAccess, async (req, res) => {
    const result = await discussionsService.concludeMediation(req.params.id, req.session);
    if (result.error) {
        return res.json({ error: result.error });
    }
    res.json(result);
});

router.post('/:id/update', middlewares.hasFullReadAccess, async (req, res) => {
    try {
        const result = await discussionsService.updateDiscussion(req.params.id, req.body, req.session);
        if (result.error) {
            return res.json({ error: result.error });
        }
        res.json(result);
    } catch (error) {
        res.json({ error: error.message || 'Failed to update discussion' });
    }
});

router.post('/:id/setIsAcceptable', middlewares.hasFullReadAccess, async (req, res) => {
    try {
        const result = await discussionsService.setIsAcceptable(
            req.params.id,
            req.body.isAcceptable,
            req.session
        );
        if (result.error) {
            return res.json({ error: result.error });
        }
        res.json(result);
    } catch (error) {
        res.json({ error: error.message || 'Failed to update consensus' });
    }
});

module.exports = router;
