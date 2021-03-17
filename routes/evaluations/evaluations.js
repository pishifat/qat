const Review = require('../../models/evaluations/review');
const Logger = require('../../models/log');
const User = require('../../models/user');
const Settings = require('../../models/settings');
const discord = require('../../helpers/discord');
const util = require('../../helpers/util');
const { EvaluationKind } = require('../../shared/enums');

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
        neutralText = 'Probation BN';
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

async function submitEval (evaluation, session, isNat, behaviorComment, moddingComment, vote) {
    let review = evaluation.reviews.find(e => e.evaluator._id.toString() == session.mongoId);
    let isNewEvaluation = false;

    if (!review) {
        isNewEvaluation = true;
        review = new Review();
        review.evaluator = session.mongoId;
    }

    review.behaviorComment = behaviorComment;
    review.moddingComment = moddingComment;
    review.vote = vote;
    await review.save();

    if (isNewEvaluation) {
        evaluation.reviews.push(review);
        await evaluation.save();

        // Send new review notification
        let description = formatDescription(evaluation, 'Submitted eval for', '');

        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(session),
                color: discord.webhookColors.lightGreen,
                description,
            }],
            evaluation.mode
        );

        const evaluationsRequired = await Settings.getModeEvaluationsRequired(evaluation.mode);

        if (isNat && !evaluation.discussion && evaluation.reviews.length >= evaluationsRequired) {
            let totalPass = 0;
            let totalNeutral = 0;
            let totalFail = 0;
            let totalNat = 1; // +1 because r.evaluator isn't an user object just the ID so won't be counted in

            evaluation.reviews.forEach(r => {
                if (r.evaluator.isNat) totalNat++;
                if (r.vote == 1) totalPass++;
                else if (r.vote == 2) totalNeutral++;
                else if (r.vote == 3) totalFail++;
            });

            if (totalNat >= evaluationsRequired) {
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

        discord.webhookPost(
            [{
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

async function replaceUser (evaluation, currentUser, evaluatorId) {
    const currentSelection = evaluation.natEvaluators.map(u => u.osuId);
    let newEvaluator;

    // assigns current user if possible. rng otherwise
    if (currentUser.isBnEvaluator && currentUser.isBnFor(evaluation.mode) && !currentSelection.includes(currentUser.osuId)) {
        newEvaluator = currentUser;
    } else {
        const evaluatorArray = await User.getAssignedNat(evaluation.mode, currentSelection, 1);
        newEvaluator = evaluatorArray[0];
    }

    const i = evaluation.natEvaluators.findIndex(e => e.id == evaluatorId);
    evaluation.natEvaluators.splice(i, 1, newEvaluator._id);
    await evaluation.save();

    return newEvaluator;
}

module.exports = {
    submitEval,
    setGroupEval,
    setFeedback,
    replaceUser,
};
