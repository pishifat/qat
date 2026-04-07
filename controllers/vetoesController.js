const vetoesService = require('../services/vetoesService');

/**
 * GET vetoes list
 * @route GET /api/v2/vetoes
 */
async function getList(req, res) {
    const isNat = res.locals.userRequest.isNat;
    const canSeePending = res.locals.userRequest.isBnOrNat;
    const archivedPage = Math.max(1, parseInt(req.query.archivedPage) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 21));
    const mongoId = req.session.mongoId;

    const listFilters = {
        mode: (req.query.mode || '').trim() || undefined,
        search: (req.query.search || req.query.value || '').trim() || undefined,
    };

    const [active, archivedVetoes, totalCount] = await Promise.all([
        vetoesService.fetchActiveVetoesMinimal(isNat, canSeePending, mongoId, listFilters),
        vetoesService.fetchArchivedVetoesMinimal(archivedPage, limit, mongoId, listFilters),
        vetoesService.countArchivedVetoes(listFilters),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    res.json({
        active,
        archived: {
            vetoes: archivedVetoes,
            page: archivedPage,
            limit,
            totalCount,
            totalPages,
        },
    });
}

/**
 * GET specific veto
 * @route GET /api/v2/vetoes/:id
 */
async function getById(req, res) {
    const isNat = res.locals.userRequest.isNat;
    const canSeePending = res.locals.userRequest.isBnOrNat;
    const mongoId = req.session.mongoId;

    const veto = await vetoesService.getVetoById(
        req.params.id,
        mongoId,
        isNat,
        canSeePending
    );

    if (!veto) {
        return res.json({ error: 'Veto not found' });
    }

    res.json(veto);
}

/**
 * POST create a reusable chatroom for a veto
 * @route POST /api/v2/vetoes/:id/chatrooms
 */
async function createChatroom(req, res) {
    try {
        const chatroom = await vetoesService.createVetoChatroom(
            req.params.id,
            req.body,
            res.locals.userRequest
        );

        res.json({
            chatroom: chatroom.chatroom,
            veto: chatroom.veto,
            success: 'Chatroom initiated.',
        });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'Something went wrong!',
        });
    }
}

/**
 * POST post-mediation chatroom (archived vetoes only)
 * @route POST /api/v2/vetoes/:id/chatrooms/post-mediation
 */
async function createPostMediationChatroom(req, res) {
    try {
        const result = await vetoesService.createPostMediationVetoChatroom(
            req.params.id,
            req.body,
            res.locals.userRequest
        );

        res.json({
            chatroom: result.chatroom,
            veto: result.veto,
            success: 'Post-mediation chatroom created.',
        });
    } catch (error) {
        res.status(error.status || 500).json({
            error: error.message || 'Something went wrong!',
        });
    }
}

module.exports = {
    getList,
    getById,
    createChatroom,
    createPostMediationChatroom,
};
