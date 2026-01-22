const webhookColors = {
    lightRed: 16742771,       // active: moveToGroupDiscussion, almostOverdueNotifications
    darkRed: 8787477,         // report, toggleIsSecurityChecked
    red: 15607337,            // overdueNotifications, problemReport, lowActivity

    lightOrange: 15639928,    // enableMockEvaluators, suggestionReport
    darkOrange: 7092736,      // pending badge, removeCustomPreference (genre, language, map, detail, mapper)
    orange: 15169835,         // replaceUser, switchBnEvaluator, progressive eval assignment

    lightYellow: 16777104,    // rejoinBnRequest, addCustomPreference (genre, language, map, detail, mapper)
    darkYellow: 7105536,      // concludeDiscussionVote, send auto activity warning
    yellow: 16777022,         // submitMediationDiscussionVote

    lightGreen: 8847214,      // submitEval, submitQA
    darkGreen: 1921053,       // addToNat, assignNatBuddy, changeEvaluatorMode, forceFullBn
    green: 4380222,           // newBnApplication

    lightBlue: 8643583,       // setConsensus, announcement
    darkBlue: 1911891,        // eval message received
    blue: 6786559,            // setFeedback

    lightPurple: 11173873,    // submitVetoMediation, toggleIsReviewed, vetoVouchThreshold
    darkPurple: 4263999,      // submitVeto, expirePendingVetoes
    purple: 8536232,          // startVetoMediation, concludeVetoMediation

    pink: 16728232,           // revealedCurrentBnEvalNotification, modified report, toggleHasTrialNat, createChatroom
    lightPink: 16748236,      // isTrialNat, SEV, toggleIsBannedFromBn, editBadgeValue

    white: 15724527,          // unarchive, addEvaluation, sendMessages
    brown: 7554849,           // submitUserNote
    gray: 8815494,            // passive: moveToGroupDiscussion, dev
    black: 2564903,           // archive, deleteVeto, deleteReview, toggleMessagesLocked, resetMediation
};

module.exports = webhookColors;
