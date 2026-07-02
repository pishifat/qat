const discussionsService = require('../services/discussionsService');

/**
 * GET resolve legacy discussion link to canonical path
 * @route GET /api/v2/discussions/:id/resolve
 */
async function resolveRoute(req, res) {
    const result = await discussionsService.resolveDiscussionRoute(req.params.id);

    if (!result) {
        return res.json({ error: 'Discussion not found' });
    }

    res.json(result);
}

module.exports = {
    resolveRoute,
};
