const imghash = require('imghash');

const METHOD = 'blockhash';
const MAX_DISTANCE = 10;

async function computeFingerprint(buffer) {
    return imghash.hash(buffer, 8);
}

function distance(a, b) {
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
    const maxDistance = options.maxDistance ?? MAX_DISTANCE;

    return candidates
        .filter((c) => c.imageSimilarity)
        .map((c) => ({
            doc: c,
            distance: distance(queryFingerprint, c.imageSimilarity),
        }))
        .filter((entry) => entry.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);
}

module.exports = {
    METHOD,
    MAX_DISTANCE,
    computeFingerprint,
    distance,
    rankBySimilarity,
};
