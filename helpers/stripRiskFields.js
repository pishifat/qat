function stripRiskFields(evalObj) {
    if (!evalObj || typeof evalObj !== 'object') return evalObj;

    delete evalObj.riskSnapshot;
    delete evalObj.riskLevel;
    delete evalObj.riskScore;
    delete evalObj.limitedHistory;

    return evalObj;
}

module.exports = { stripRiskFields };
