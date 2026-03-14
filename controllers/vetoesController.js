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

module.exports = {
    getList,
    getById,
};
