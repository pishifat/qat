const imghash = require('imghash');

const PHASH_MAX_DISTANCE = 10;
const DEFAULT_METHOD = 'phash';

async function computeFingerprint(buffer, method = DEFAULT_METHOD) {
    if (method === 'clip') {
        throw new Error('CLIP similarity is not implemented yet');
    }

    return imghash.hash(buffer, 8);
}

function distance(a, b, method = DEFAULT_METHOD) {
    if (method === 'clip') {
        throw new Error('CLIP similarity is not implemented yet');
    }

    if (!a || !b || a.length !== b.length) {
        return Infinity;
    }

    const binA = imghash.hexToBinary(a);
    const binB = imghash.hexToBinary(b);
    let dist = 0;

    for (let i = 0; i < binA.length; i++) {
        if (binA[i] !== binB[i]) dist++;
    }

    return dist;
}

function rankBySimilarity(queryFingerprint, candidates, options = {}) {
    const maxDistance = options.maxDistance ?? PHASH_MAX_DISTANCE;
    const method = options.method ?? DEFAULT_METHOD;

    return candidates
        .filter((c) => c.imageSimilarity && (!c.imageSimilarityMethod || c.imageSimilarityMethod === method))
        .map((c) => ({
            doc: c,
            distance: distance(queryFingerprint, c.imageSimilarity, method),
        }))
        .filter((entry) => entry.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);
}

module.exports = {
    PHASH_MAX_DISTANCE,
    DEFAULT_METHOD,
    computeFingerprint,
    distance,
    rankBySimilarity,
};
