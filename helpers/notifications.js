const { default: axios } = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const moment = require('moment');
const discord = require('./discord');
const osuv1 = require('./osuv1');
const util = require('./util');
const AppEvaluation = require('../models/evaluations/appEvaluation');
const BnEvaluation = require('../models/evaluations/bnEvaluation');
const Veto = require('../models/veto');
const User = require('../models/user');
const BeatmapReport = require('../models/beatmapReport');
const Aiess = require('../models/aiess');

const defaultPopulate = [{
    path: 'user',
    select: 'username osuId modesInfo',
}];

const notifyDeadlines = cron.schedule('0 16 * * *', async () => {
    // establish dates for reference
    const date = new Date();
    const nearDeadline = new Date();
    nearDeadline.setDate(nearDeadline.getDate() + 1);
    const startRange = new Date();
    startRange.setDate(startRange.getDate() + 13);
    const endRange = new Date();
    endRange.setDate(endRange.getDate() + 14);

    // find active events
    let [activeApps, activeRounds, activeVetoes] = await Promise.all([
        AppEvaluation
            .find({
                active: true,
                test: { $exists: true },
            })
            .populate(defaultPopulate),

        BnEvaluation
            .find({ active: true })
            .populate(defaultPopulate),

        Veto.find({ status: 'wip' }),
    ]);

    // determine if NAT receives highlight by mode
    let osuHighlight;
    let taikoHighlight;
    let catchHighlight;
    let maniaHighlight;

    // find and post webhook for vetoes
    for (let i = 0; i < activeVetoes.length; i++) {
        const veto = activeVetoes[i];
        let description = `Veto mediation for [**${veto.beatmapTitle}**](http://bn.mappersguild.com/vetoes?beatmaps=${veto.id}) `;

        if (date > veto.deadline) {
            description += 'is overdue!';
        } else if (veto.deadline < nearDeadline) {
            description += 'is due in less than 24 hours!';
        }

        if (date > veto.deadline || veto.deadline < nearDeadline) {
            await discord.webhookPost(
                [{
                    description,
                    color: discord.webhookColors.red,
                }],
                veto.mode
            );
            await util.sleep(500);
        }
    }

    // find and post webhook for BN applications
    for (let i = 0; i < activeApps.length; i++) {
        const app = activeApps[i];

        let addition = 7;

        if (app.discussion) { addition += 7; }

        const deadline = new Date(app.createdAt.setDate(app.createdAt.getDate() + addition));
        let description = `[**${app.user.username}**'s BN app](http://bn.mappersguild.com/appeval?id=${app.id}) `;
        let generateWebhook;

        if (date > deadline) {
            if (!osuHighlight && app.mode === 'osu') { osuHighlight = true; }

            if (!taikoHighlight && app.mode === 'taiko') { taikoHighlight = true; }

            if (!catchHighlight && app.mode === 'catch') { catchHighlight = true; }

            if (!maniaHighlight && app.mode === 'mania') { maniaHighlight = true; }

            description += 'is overdue!';
            generateWebhook = true;
        } else if (deadline < nearDeadline) {
            description += 'is due in less than 24 hours!';
            generateWebhook = true;
        }

        if (generateWebhook) {
            await discord.webhookPost(
                [{
                    description,
                    color: discord.webhookColors.red,
                }],
                app.mode
            );
            await util.sleep(500);
        }
    }

    // find and post webhook for current BN evals
    for (let i = 0; i < activeRounds.length; i++) {
        const round = activeRounds[i];

        let description = `[**${round.user.username}**'s current BN eval](http://bn.mappersguild.com/bneval?id=${round.id}) `;
        let natList = '';
        let generateWebhook;

        if (date > round.deadline) {
            if (!osuHighlight && round.mode === 'osu') { osuHighlight = true; }

            if (!taikoHighlight && round.mode === 'taiko') { taikoHighlight = true; }

            if (!catchHighlight && round.mode === 'catch') { catchHighlight = true; }

            if (!maniaHighlight && round.mode === 'mania') { maniaHighlight = true; }

            description += 'is overdue!';
            generateWebhook = true;
        } else if (round.deadline < nearDeadline) {
            description += 'is due in less than 24 hours!';
            generateWebhook = true;
        } else if (round.deadline > startRange && round.deadline < endRange) {
            description += 'is due in two weeks!';
            generateWebhook = true;

            const twoEvaluationModes = ['catch', 'mania'];
            //const threeEvaluationModes = ['osu', 'taiko'];

            if (!round.natEvaluators || !round.natEvaluators.length) {
                const invalids = [8129817, 3178418];
                const assignedNat = await User.aggregate([
                    { $match: { groups: 'nat', 'modesInfo.mode': round.mode, osuId: { $nin: invalids } } },
                    { $sample: { size: twoEvaluationModes.includes(round.mode) ? 2 : 3 } },
                ]);

                for (let i = 0; i < assignedNat.length; i++) {
                    let user = assignedNat[i];
                    await BnEvaluation.findByIdAndUpdate(round.id, { $push: { natEvaluators: user._id } });
                    natList += user.username;

                    if (i + 1 < assignedNat.length) {
                        natList += ', ';
                    }
                }
            } else {
                for (let i = 0; i < round.natEvaluators.length; i++) {
                    let userId = round.natEvaluators[i];
                    let user = await User.findById(userId);
                    natList += user.username;

                    if (i + 1 < round.natEvaluators.length) {
                        natList += ', ';
                    }
                }
            }
        }

        if (generateWebhook && !natList.length) {
            await discord.webhookPost(
                [{
                    description,
                    color: discord.webhookColors.red,
                }],
                round.mode
            );
            await util.sleep(500);
        } else if (generateWebhook && natList.length) {

            await discord.webhookPost(
                [{
                    description,
                    color: discord.webhookColors.pink,
                    fields: [
                        {
                            name: 'Assigned NAT',
                            value: natList,
                        },
                    ],
                }],
                round.mode
            );
            await util.sleep(500);
        }
    }

    // send highlights if needed
    if (osuHighlight) discord.highlightWebhookPost('time to find a new NAT member?', 'osu');
    if (taikoHighlight) discord.highlightWebhookPost('i wonder who would make the best new NAT...', 'taiko');
    if (catchHighlight) discord.highlightWebhookPost('oh no', 'catch');
    if (maniaHighlight) discord.highlightWebhookPost('so who is the new NAT candidate?', 'mania');
}, {
    scheduled: false,
});

const notifyBeatmapReports = cron.schedule('0 * * * *', async () => {
    // find pending discussion posts
    let url = 'https://osu.ppy.sh/beatmapsets/beatmap-discussions?user=&beatmapset_status=qualified&limit=50&message_types%5B%5D=suggestion&message_types%5B%5D=problem&only_unresolved=on';
    const historyHtml = await axios.get(url);
    const $ = cheerio.load(historyHtml.data);
    let discussions = JSON.parse($('#json-discussions').html());

    // find database's discussion posts
    const date = new Date();
    date.setDate(date.getDate() - 10); // used to be 7, but backlog in qualified maps feed caused duplicate reports
    let beatmapReports = await BeatmapReport.find({ createdAt: { $gte: date } });

    // create array of reported beatmapsetIds
    let beatmapsetIds = [];
    beatmapReports.forEach(beatmapReport => {
        if (!beatmapsetIds.includes(beatmapReport.beatmapsetId)) {
            beatmapsetIds.push(beatmapReport.beatmapsetId);
        }
    });

    // determine which posts haven't been sent to #report-feed
    for (let i = 0; i < discussions.length; i++) {
        const discussion = discussions[i];
        let createWebhook;

        if (!beatmapsetIds.includes(discussion.beatmapset_id)) {
            createWebhook = true;
        } else {
            let alreadyReported = await BeatmapReport.findOne({
                createdAt: { $gte: date },
                beatmapsetId: discussion.beatmapset_id,
                reporterUserId: discussion.starting_post.user_id,
            });

            if (!alreadyReported) {
                createWebhook = true;
            }
        }

        if (createWebhook) {
            // create event in db
            beatmapsetIds.push(discussion.beatmapset_id);
            await BeatmapReport.create({
                beatmapsetId: discussion.beatmapset_id,
                postId: discussion.id,
                reporterUserId: discussion.starting_post.user_id,
            });

            let userInfo = await osuv1.getUserInfoV1(discussion.starting_post.user_id);
            await util.sleep(500);

            // identify modes
            let modes = [];

            if (discussion.beatmap) {
                if (discussion.beatmap.mode == 'fruits') modes.push('catch');
                else modes.push(discussion.beatmap.mode);

            } else {
                let beatmapsetInfo = await osuv1.beatmapsetInfo(discussion.beatmapset_id, true);
                beatmapsetInfo.forEach(beatmap => {
                    switch (beatmap.mode) {
                        case '0':
                            if (!modes.includes('osu')) modes.push('osu');
                            break;
                        case '1':
                            if (!modes.includes('taiko')) modes.push('taiko');
                            break;
                        case '2':
                            if (!modes.includes('catch')) modes.push('catch');
                            break;
                        case '3':
                            if (!modes.includes('mania')) modes.push('mania');
                            break;
                    }
                });
            }

            // send webhook
            await discord.webhookPost(
                [{
                    author: {
                        name: userInfo.username,
                        icon_url: `https://a.ppy.sh/${discussion.starting_post.user_id}`,
                        url: `https://osu.ppy.sh/users/${discussion.starting_post.user_id}`,
                    },
                    description: `[**${discussion.beatmapset.artist} - ${discussion.beatmapset.title}**](https://osu.ppy.sh/beatmapsets/${discussion.beatmapset_id}/discussion/-/generalAll#/${discussion.id})\nMapped by [${discussion.beatmapset.creator}](https://osu.ppy.sh/users/${discussion.beatmapset.user_id}) [**${modes.join(', ')}**]`,
                    thumbnail: {
                        url: `https://b.ppy.sh/thumb/${discussion.beatmapset_id}.jpg`,
                    },
                    color: discussion.message_type == 'suggestion' ? discord.webhookColors.lightOrange : discord.webhookColors.red,
                    fields: [
                        {
                            name: discussion.message_type,
                            value: discussion.starting_post.message.length > 500 ? discussion.starting_post.message.slice(0,500) + '... *(truncated)*' : discussion.starting_post.message,
                        },
                    ],
                }],
                'beatmapReport'
            );
            await util.sleep(500);

            // send highlights
            if (discussion.message_type == 'problem') {
                modes.forEach(mode => {
                    discord.highlightWebhookPost('', `${mode}BeatmapReport`);
                });
            }
        }
    }
}, {
    scheduled: false,
});

/**
 * Notify of quality assurance helper activity every saturday at 22 pm
 */
const notifyQualityAssurance = cron.schedule('0 22 * * 6', async () => {
    const users = await User
        .find({
            $or: [
                { groups: 'nat' },
                { groups: 'bn' },
            ],
        })
        .populate({
            path: 'qualityAssuranceChecks',
        })
        .sort({ username: 1 });

    for (let i = 0; i < users.length; i++) {
        const sevenDaysAgo = moment().subtract(7, 'days');

        const recentCount = users[i].qualityAssuranceChecks.filter(event =>
            moment(event.time).isAfter(sevenDaysAgo)
        ).length;

        users[i].recentQualityAssuranceChecks = recentCount;
    }

    const overallUsers = [...users];
    const recentUsers = [...users];

    overallUsers.sort((a, b) => {
        if (a.qualityAssuranceChecks.length > b.qualityAssuranceChecks.length) return -1;
        if (a.qualityAssuranceChecks.length < b.qualityAssuranceChecks.length) return 1;

        return 0;
    });

    recentUsers.sort((a, b) => {
        if (a.recentQualityAssuranceChecks > b.recentQualityAssuranceChecks) return -1;
        if (a.recentQualityAssuranceChecks < b.recentQualityAssuranceChecks) return 1;

        return 0;
    });

    const modes = ['osu', 'taiko', 'catch', 'mania'];

    for (const mode of modes) {
        let topTenText = '';
        let topTenCount = 0;

        for (let i = 0; topTenCount < 10 && i < users.length; i++) {
            const user = overallUsers[i];

            if (user.isBnFor(mode) && user.qualityAssuranceChecks.length > 0) {
                topTenCount++;
                topTenText += `${topTenCount}. ${user.username}: **${user.qualityAssuranceChecks.length}**\n`;
            }
        }

        let recentText = '';
        let recentCount = 0;

        for (let i = 0; recentCount < 3 && i < users.length; i++) {
            const user = recentUsers[i];

            if (user.isBnFor(mode) && user.recentQualityAssuranceChecks > 0) {
                recentCount++;
                recentText += `${recentCount}. ${user.username}: **${user.recentQualityAssuranceChecks}**\n`;
            }
        }

        await discord.webhookPost(
            [{
                title: `${mode == 'osu' ? 'osu!' : 'osu!' + mode} QA activity`,
                color: discord.webhookColors.lightBlue,
                fields: [{
                    name: `all time`,
                    value: topTenText,
                },{
                    name: `last 7 days`,
                    value: recentText,
                }],
            }],
            mode == 'osu' ? 'standardQualityAssurance' : 'taikoCatchManiaQualityAssurance'
        );
        await util.sleep(500);
    }
}, {
    scheduled: false,
});

/**
 * Checks for bns with less than 6 mods (4 for mania) the first day of every month
 */
const lowActivityTask = cron.schedule('0 23 1 * *', async () => {
    const lowActivityFields = [];
    const initialDate = moment().subtract(3, 'months').toDate();

    const bns = await User.find({ groups: 'bn' });

    for (const bn of bns) {
        const joinedHistory = bn.history.filter(h => h.kind === 'joined');
        const date = joinedHistory[joinedHistory.length - 1].date;

        if (new Date(date) < initialDate) {
            for (const mode of bn.modes) {
                if (await hasLowActivity(initialDate, bn, mode)) {
                    lowActivityFields.push({
                        name: bn.username,
                        value: `${await findUniqueNominations(initialDate, bn)}`,
                        inline: true,
                        mode,
                    });
                }
            }
        }
    }

    if (!lowActivityFields.length) return;

    let formatField = { name: 'username', value: 'nominations within 3 months' };
    let osuFields = [];
    let taikoFields = [];
    let catchFields = [];
    let maniaFields = [];
    osuFields.push(formatField);
    taikoFields.push(formatField);
    catchFields.push(formatField);
    maniaFields.push(formatField);

    lowActivityFields.forEach(field => {
        switch (field.mode) {
            case 'osu':
                osuFields.push(field);
                break;
            case 'taiko':
                taikoFields.push(field);
                break;
            case 'catch':
                catchFields.push(field);
                break;
            case 'mania':
                maniaFields.push(field);
                break;
        }
    });

    const modeFields = [osuFields, taikoFields, catchFields, maniaFields];
    const modes = ['osu', 'taiko', 'catch', 'mania'];

    for (let i = 0; i < modeFields.length; i++) {
        const modeField = modeFields[i];

        if (modeField.length > 1) { // only create webhook if there are users with low activity in mode
            await discord.webhookPost(
                [{
                    title: 'Low Activity',
                    description: `The following users have low activity from ${initialDate.toISOString().slice(0,10)} to today`,
                    color: discord.webhookColors.red,
                    fields: modeField,
                }],
                modes[i]
            );
        }

        await util.sleep(500);
    }
}, {
    scheduled: false,
});

/**
 * @param {Date} initialDate
 * @param {object} bn
 * @returns {Promise<number>} number of unique bubbled/qualified
 */
async function findUniqueNominations (initialDate, bn) {
    const events = await Aiess.distinct('beatmapsetId', {
        userId: bn.osuId,
        type: {
            $in: ['nominate', 'qualify'],
        },
        time: {
            $gt: initialDate,
        },
    });

    return events.length;
}

/**
 * @param {Date} initialDate
 * @param {object} bn
 * @returns {Promise<number>} number of qa checks
 */
async function findQualityAssuranceChecks (initialDate, bn) {
    const events = await Aiess.find({
        qualityAssuranceCheckers: bn.id,
        updatedAt: { $gt: initialDate },
    });

    return events.length;
}

/**
 * @param {Date} initialDate
 * @param {object} bn
 * @param {string} mode
 * @returns {Promise<boolean>} whether or not the user has 'low activity'
 */
async function hasLowActivity (initialDate, bn, mode) {
    const [uniqueNominations, qualityAssuranceChecks] = await Promise.all([
        findUniqueNominations(initialDate, bn),
        findQualityAssuranceChecks(initialDate, bn),
    ]);

    if (
        (uniqueNominations + (qualityAssuranceChecks / 4) < 4 && mode == 'mania') ||
        (uniqueNominations + (qualityAssuranceChecks / 4) < 6 && mode != 'mania')
    ) {
        return true;
    }

    return false;
}

module.exports = { notifyDeadlines, notifyBeatmapReports, lowActivityTask, notifyQualityAssurance };
