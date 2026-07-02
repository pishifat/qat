const NAT_CONSENSUS = ['remainInNat', 'moveToBn', 'removeFromNat'];
const BN_CONSENSUS = ['fullBn', 'probationBn', 'removeFromBn'];

export function userIsNatEvaluatorForMode(user, mode) {
    if (!user || !mode) return false;

    const modes = user.evaluatorModes || [];

    return modes.includes(mode) || modes.includes('none');
}

export function isNatEvaluation(evaluation) {
    if (!evaluation) return false;

    if (evaluation.selfSummary) return true;

    if (NAT_CONSENSUS.includes(evaluation.consensus)) return true;

    // Archived BN evals keep BN consensus even if the user is now a NAT evaluator for that mode
    if (BN_CONSENSUS.includes(evaluation.consensus)) return false;

    const user = evaluation.user;

    if (user && evaluation.mode) return userIsNatEvaluatorForMode(user, evaluation.mode);

    return false;
}

export { NAT_CONSENSUS, BN_CONSENSUS };
