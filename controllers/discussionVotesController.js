const discussionsService = require('../services/discussionsService');

/**
 * GET discussion votes list
 * @route GET /api/v2/discussion-votes
 */
async function getList(req, res) {
    const hasFullReadAccess = !!res.locals.userRequest.hasFullReadAccess;
    const archivedPage = Math.max(1, parseInt(req.query.archivedPage) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 21));
    const mongoId = req.session.mongoId;

    const listFilters = {
        mode: (req.query.mode || '').trim() || undefined,
        search: (req.query.search || req.query.value || '').trim() || undefined,
    };

    const [active, archivedDiscussions, totalCount] = await Promise.all([
        discussionsService.fetchActiveDiscussionsMinimal(false, hasFullReadAccess, mongoId, listFilters),
        discussionsService.fetchArchivedDiscussionsMinimal(false, archivedPage, limit, mongoId, hasFullReadAccess, listFilters),
        discussionsService.countArchivedDiscussions(false, hasFullReadAccess, listFilters),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    res.json({
        active,
        archived: {
            discussions: archivedDiscussions,
            page: archivedPage,
            limit,
            totalCount,
            totalPages,
        },
    });
}

/**
 * GET specific discussion vote
 * @route GET /api/v2/discussion-votes/:id
 */
async function getById(req, res) {
    const hasFullReadAccess = !!res.locals.userRequest.hasFullReadAccess;
    const isNat = !!res.locals.userRequest.isNat;

    const discussion = await discussionsService.getDiscussionById(
        req.params.id,
        false,
        req.session.mongoId,
        hasFullReadAccess,
        isNat
    );

    if (!discussion) {
        return res.json({ error: 'Discussion vote not found' });
    }

    res.json(discussion);
}

module.exports = {
    getList,
    getById,
};
