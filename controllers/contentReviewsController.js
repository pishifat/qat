const discussionsService = require('../services/discussionsService');
const imageSimilarityService = require('../services/imageSimilarityService');

/**
 * GET content reviews list
 * @route GET /api/v2/content-reviews
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
        discussionsService.fetchActiveDiscussionsMinimal(true, hasFullReadAccess, mongoId, listFilters),
        discussionsService.fetchArchivedDiscussionsMinimal(true, archivedPage, limit, mongoId, hasFullReadAccess, listFilters),
        discussionsService.countArchivedDiscussions(true, hasFullReadAccess, listFilters),
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
 * GET specific content review
 * @route GET /api/v2/content-reviews/:id
 */
async function getById(req, res) {
    const hasFullReadAccess = !!res.locals.userRequest.hasFullReadAccess;
    const isNat = !!res.locals.userRequest.isNat;

    const discussion = await discussionsService.getDiscussionById(
        req.params.id,
        true,
        req.session.mongoId,
        hasFullReadAccess,
        isNat
    );

    if (!discussion) {
        return res.json({ error: 'Content review not found' });
    }

    res.json(discussion);
}

/**
 * POST search content reviews by image similarity
 * @route POST /api/v2/content-reviews/image-search
 */
async function imageSearch(req, res) {
    if (!req.file || !req.file.buffer) {
        return res.json({ error: 'No image provided' });
    }

    const hasFullReadAccess = !!res.locals.userRequest.hasFullReadAccess;
    const archivedPage = Math.max(1, parseInt(req.body.archivedPage) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.body.limit) || 21));
    const method = (req.body.method || imageSimilarityService.DEFAULT_METHOD).trim();

    const result = await discussionsService.searchContentReviewsByImage(
        req.file.buffer,
        archivedPage,
        limit,
        req.session.mongoId,
        hasFullReadAccess,
        method
    );

    if (result.error) {
        return res.json({ error: result.error });
    }

    res.json(result);
}

module.exports = {
    getList,
    getById,
    imageSearch,
};
