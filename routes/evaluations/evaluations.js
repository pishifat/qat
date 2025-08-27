const Review = require('../../models/evaluations/review');
const Logger = require('../../models/log');
const User = require('../../models/user');
const Evaluation = require('../../models/evaluations/evaluation');
const AppEvaluation = require('../../models/evaluations/appEvaluation');
const BnEvaluation = require('../../models/evaluations/bnEvaluation');
const ResignationEvaluation = require('../../models/evaluations/resignationEvaluation');
const Settings = require('../../models/settings');
const discord = require('../../helpers/discord');
const util = require('../../helpers/util');
const { EvaluationKind, BnEvaluationConsensus, ResignationConsensus } = require('../../shared/enums');
const moment = require('moment');

/**
 * @param {import('../../models/interfaces/evaluations').IEvaluationDocument} evaluation
 * @param {string} preText
 * @param {string} [postText]
 * @returns {string} {preText} [**Someone**'s {kind}](http://bn.mappersguild.com/{route}?id={id}) {postText}
 */
function formatDescription(evaluation, preText, postText) {
    let route = 'bneval';
    let kindText = '';

    if (evaluation.isApplication) {
        kindText = 'BN application';
        route = 'appeval';
    } else if (evaluation.isBnEvaluation) {
        kindText = 'current BN eval';
    } else {
        kindText = 'resignation eval';
    }

    return `${preText} [**${evaluation.user.username}**'s ${kindText}](http://bn.mappersguild.com/${route}?id=${evaluation.id}) ${postText}`;
}

/**
 * @param {string} evaluationKind
 * @param {number} totalPass
 * @param {number} totalNeutral
 * @param {number} totalFail
 * @returns {string} ${passText}: **${totalPass}**, ${neutralText}: **${totalNeutral}**, ${failText}: **${totalFail}**
 */
function formatConsensus(evaluationKind, totalPass, totalNeutral, totalFail) {
    let passText = 'Pass';
    let neutralText = 'Neutral';
    let failText = 'Fail';

    if (evaluationKind === EvaluationKind.BnEvaluation) {
        passText = 'Full BN';
        neutralText = 'Warning';
        failText = 'Remove from BN';
    } else if (evaluationKind === EvaluationKind.Resignation) {
        passText = 'Resign on good terms';
        neutralText = 'Resign on standard terms';
    }

    let consensus = `${passText}: **${totalPass}**, ${neutralText}: **${totalNeutral}**`;

    if (evaluationKind !== EvaluationKind.Resignation) {
        consensus += `, ${failText}: **${totalFail}**`;
    }

    return consensus;
}

async function submitEval (evaluation, session, isNat, comment, vote) {
    let review = evaluation.reviews.find(e => e.evaluator._id.toString() == session.mongoId);
    let isNewEvaluation = false;

    if (!review) {
        isNewEvaluation = true;
        review = new Review();
        review.evaluator = session.mongoId;
    }

    review.moddingComment = comment;
    review.vote = vote;
    await review.save();

    if (isNewEvaluation) {
        evaluation.reviews.push(review);
        await evaluation.save();

        // Send new review notification
        let description = formatDescription(evaluation, 'Submitted eval for', '');

        if (!evaluation.user.isNat) {
            discord.webhookPost(
                [{
                    author: discord.defaultWebhookAuthor(session),
                    color: discord.webhookColors.lightGreen,
                    description,
                }],
                evaluation.mode
            );
        }

        // +1 evaluation required when a mode has trial NAT (because there's more assigned users)
        const baseEvalsRequired = await Settings.getModeEvaluationsRequired(evaluation.mode);
        const evaluationsRequired = await Settings.getModeHasTrialNat(evaluation.mode) ? baseEvalsRequired + 1 : baseEvalsRequired;

        if (isNat && !evaluation.discussion) {
            let totalPass = 0;
            let totalNatPass = 0;
            let totalNeutral = 0;
            let totalFail = 0;
            let totalNatFail = 0;
            let totalNat = 1; // +1 because r.evaluator isn't an user object just the ID so won't be counted in

            if (vote == 1 && isNat) totalNatPass++;
            if (vote == 3 && isNat) totalNatFail++;

            for (const review of evaluation.reviews) {
                if (review.evaluator.isNat || review.evaluator.isTrialNat) {
                    totalNat++;
                    
                    if (review.vote == 1) totalNatPass++;
                    if (review.vote == 3) totalNatFail++;
                }
                if (review.vote == 1) totalPass++;
                else if (review.vote == 2) totalNeutral++;
                else if (review.vote == 3) totalFail++;
            }

            if (totalNat >= evaluationsRequired || (totalNat == (evaluationsRequired - 1) && (totalNat == totalNatFail || (evaluation.isApplication && totalNat == totalNatPass)))) {
                evaluation.discussion = true;
                await evaluation.save();

                // Send moved to discussion notification
                discord.webhookPost(
                    [{
                        thumbnail: {
                            url: `https://a.ppy.sh/${evaluation.user.osuId}`,
                        },
                        color: discord.webhookColors.gray,
                        description: formatDescription(evaluation, '', 'moved to group discussion'),
                        fields: [
                            {
                                name: 'Votes',
                                value: formatConsensus(evaluation.kind, totalPass, totalNeutral, totalFail),
                            },
                        ],
                    }],
                    evaluation.mode
                );
            }
        }
    }

    return isNewEvaluation;
}

async function submitMockEval (evaluation, session, comment, vote) {
    let mockReview = evaluation.mockReviews.find(e => e.evaluator._id.toString() == session.mongoId);
    let isNewEvaluation = false;

    if (!mockReview) {
        isNewEvaluation = true;
        mockReview = new Review();
        mockReview.evaluator = session.mongoId;
    }

    mockReview.moddingComment = comment;
    mockReview.vote = vote;
    await mockReview.save();

    if (isNewEvaluation) {
        evaluation.mockReviews.push(mockReview);
        await evaluation.save();
    }

    return isNewEvaluation;
}

async function setGroupEval (evaluations, session) {
    for (const evaluation of evaluations) {
        evaluation.discussion = true;
        await evaluation.save();

        let totalPass = 0;
        let totalNeutral = 0;
        let totalFail = 0;

        evaluation.reviews.forEach(review => {
            if (review.vote == 1) totalPass++;
            else if (review.vote == 2) totalNeutral++;
            else if (review.vote == 3) totalFail++;
        });

        // Send moved notification
        
        if (evaluation.user.evaluatorModes && evaluation.user.evaluatorModes.includes(evaluation.mode)) {
            const selfSummary = evaluation.selfSummary?.comment || '*No summary provided*';
            discord.webhookPost(
                [{
                    thumbnail: {
                        url: `https://a.ppy.sh/${evaluation.user.osuId}`,
                    },
                    author: discord.defaultWebhookAuthor(session),
                    color: discord.webhookColors.lightRed,
                    description: `Moved [**${evaluation.user.username}**'s NAT eval](https://bn.mappersguild.com/bneval?id=${evaluation.id}) to group discussion`,
                    fields: [
                        {
                            name: 'Summary',
                            value: selfSummary.length > 950 ? selfSummary.slice(0, 950) + '... *(truncated)*' : selfSummary,
                        },
                    ],
                }],
                evaluation.mode
            );

        } else {
            discord.webhookPost(
                [{
                    thumbnail: {
                        url: `https://a.ppy.sh/${evaluation.user.osuId}`,
                    },
                    author: discord.defaultWebhookAuthor(session),
                    color: discord.webhookColors.lightRed,
                    description: formatDescription(evaluation, 'Moved', 'to group discussion'),
                    fields: [
                        {
                            name: 'Votes',
                            value: formatConsensus(evaluation.kind, totalPass, totalNeutral, totalFail),
                        },
                    ],
                }],
                evaluation.mode
            );
        }
    }
}

async function setFeedback (evaluation, feedback, session) {
    const action = evaluation.feedback ? 'Edited' : 'Created';

    Logger.generate(
        session.mongoId,
        `${action} feedback of ${evaluation.user.username}'s ${evaluation.mode} evaluation`,
        evaluation.isApplication ? 'appEvaluation' : 'bnEvaluation',
        evaluation._id
    );

    evaluation.feedback = feedback;
    await evaluation.save();

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(session),
            color: discord.webhookColors.blue,
            description: formatDescription(evaluation, '', `feedback: ${util.shorten(feedback, 925, '... *(truncated)*')}`),
        }],
        evaluation.mode
    );

    return evaluation;
}

async function selectMockEvaluators (evaluation, selectAll) {
    // Find eligible users: full BNs in the evaluation's mode with isBnEvaluator: true and isTrialNat: false,
    // excluding the evaluation's user
    const allEligibleUsers = await User.aggregate([
        {
            $match: {
                groups: 'bn',
                isBnEvaluator: true,
                isTrialNat: false,
                modesInfo: { 
                    $elemMatch: { 
                        mode: evaluation.mode, 
                        level: 'full' 
                    } 
                },
                _id: { $ne: evaluation.user._id },
            },
        },
        { $sample: { size: 1000 } },
    ]);

    if (selectAll) {
        return (allEligibleUsers);
    }

    // Calculate selection count: 30% of eligible users, minimum 5
    const thirtyPercent = Math.floor(allEligibleUsers.length * 0.3);
    const selectionCount = Math.max(5, thirtyPercent);
    
    // Select the appropriate number of users (or all if fewer than 5)
    const selectedCount = Math.min(selectionCount, allEligibleUsers.length);
    const selectedUsers = allEligibleUsers.slice(0, selectedCount);

    return selectedUsers;
}

async function replaceUser (evaluation, currentUserId, evaluatorId, isBn, selectedUserId) {
    const currentSelection = isBn ? evaluation.bnEvaluators.map(u => u.osuId) : evaluation.natEvaluators.map(u => u.osuId);
    let newEvaluator;

    // assigns selected user if available, otherwise assigns based on bag for NAT or random for BN
    if (selectedUserId) {
        newEvaluator = await User.findById(selectedUserId);
        newEvaluator.inBag = false;
        await newEvaluator.save();
    } else {
        const evaluatorArray = isBn ? await User.getAssignedTrialNat(evaluation.mode, currentSelection, 1) : await User.getAssignedNat(evaluation.mode, currentUserId, currentSelection, 1);
        newEvaluator = evaluatorArray[0];
    }

    const i = isBn ? evaluation.bnEvaluators.findIndex(e => e.id == evaluatorId) : evaluation.natEvaluators.findIndex(e => e.id == evaluatorId);

    if (isBn) {
        evaluation.bnEvaluators.splice(i, 1, newEvaluator._id);
    } else {
        evaluation.natEvaluators.splice(i, 1, newEvaluator._id);
    }

    evaluation.rerolls.push({
        createdAt: new Date(),
        oldEvaluator: evaluatorId,
        newEvaluator: newEvaluator._id,
        type: 'manual',
    });

    await evaluation.save();

    return newEvaluator;
}

module.exports = {
    submitEval,
    submitMockEval,
    selectMockEvaluators,
    setGroupEval,
    setFeedback,
    replaceUser,
};
