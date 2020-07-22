const Review = require('../../models/evaluations/review');
const Logger = require('../../models/log');
const User = require('../../models/user');
const discord = require('../../helpers/discord');

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
        let description = '';

        if (evaluation.kind === 'application') {
            description = `Submitted eval for [**${evaluation.user.username}**'s BN application](http://bn.mappersguild.com/appeval?id=${evaluation.id})`;
        } else {
            description = `Submitted eval for [**${evaluation.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id})`;
        }

        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(session),
                color: discord.webhookColors.lightGreen,
                description,
            }],
            evaluation.mode
        );

        const twoEvaluationModes = ['catch', 'mania'];
        const threeEvaluationModes = ['osu', 'taiko'];

        if (!evaluation.discussion &&
            (
                (threeEvaluationModes.includes(evaluation.mode) && evaluation.reviews.length > 2) ||
                (twoEvaluationModes.includes(evaluation.mode) && evaluation.reviews.length > 1)
            )
        ) {
            let totalPass = 0;
            let totalNeutral = 0;
            let totalFail = 0;
            let totalNat = 0;

            evaluation.reviews.forEach(r => {
                if (r.evaluator.isNat) totalNat++;
                if (r.vote == 1) totalPass++;
                else if (r.vote == 2) totalNeutral++;
                else if (r.vote == 3) totalFail++;
            });

            if (
                isNat &&
                (threeEvaluationModes.includes(evaluation.mode) && totalNat >= 2) ||
                (twoEvaluationModes.includes(evaluation.mode) && totalNat >= 1)
            ) {
                evaluation.discussion = true;
                await evaluation.save();

                // Send moved to discussion notification
                let neutralText = 'Neutral';

                if (evaluation.kind === 'application') {
                    description = `[**${evaluation.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${evaluation.id}) moved to group discussion`;
                } else {
                    neutralText = 'Probation';
                    description = `[**${evaluation.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id}) moved to group discussion`;
                }

                discord.webhookPost(
                    [{
                        thumbnail: {
                            url: `https://a.ppy.sh/${evaluation.user.osuId}`,
                        },
                        color: discord.webhookColors.gray,
                        description,
                        fields: [
                            {
                                name: 'Votes',
                                value: `Pass: **${totalPass}**, ${neutralText}: **${totalNeutral}**, Fail: **${totalFail}**`,
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

        let pass = 0;
        let neutral = 0;
        let fail = 0;

        evaluation.reviews.forEach(review => {
            if (review.vote == 1) pass++;
            else if (review.vote == 2) neutral++;
            else if (review.vote == 3) fail++;
        });

        // Send moved notification
        let description = '';
        let neutralText = 'Neutral';

        if (evaluation.kind === 'application') {
            description =  `Moved [**${evaluation.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${evaluation.id}) to group discussion`;
        } else {
            neutralText = 'Probation';
            description = `Moved [**${evaluation.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${evaluation.id}) to group discussion`;
        }

        discord.webhookPost(
            [{
                author: discord.defaultWebhookAuthor(session),
                color: discord.webhookColors.lightRed,
                description,
                fields: [
                    {
                        name: 'Votes',
                        value: `Pass: **${pass}**, ${neutralText}: **${neutral}**, Fail: **${fail}**`,
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
        evaluation.kind === 'application' ? 'appEvaluation' : 'bnEvaluation',
        evaluation._id
    );

    evaluation.feedback = feedback;
    await evaluation.save();

    discord.webhookPost(
        [{
            author: discord.defaultWebhookAuthor(session),
            color: discord.webhookColors.blue,
            description: `**[${evaluation.user.username}'s evaluation](http://bn.mappersguild.com/${evaluation.kind === 'application' ? 'appeval' : 'bneval'}?id=${evaluation.id}) feedback**: ${feedback.length > 925 ? feedback.slice(0,925) + '... *(truncated)*' : feedback}`,
        }],
        evaluation.mode
    );

    return evaluation;
}

async function replaceUser (evaluation, currentUser, evaluatorId) {
    const invalids = [
        8129817,
        3178418,
        ...evaluation.natEvaluators.map(u => u.osuId),
    ];
    let newEvaluator;

    // assigns current user if possible. rng otherwise
    if (!invalids.includes(currentUser.osuId) && currentUser.isBnFor(evaluation.mode)) {
        newEvaluator = currentUser;
    } else {
        const evaluatorArray = await User.aggregate([
            {
                $match: {
                    groups: 'nat',
                    'modesInfo.mode': evaluation.mode,
                    osuId: { $nin: invalids },
                },
            },
            { $sample: { size: 1 } },
        ]);
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
