const axios = require('axios');
const cheerio = require('cheerio');
const api = require('./api');
const helper = require('./helpers');
const BnApp = require('../models/bnApp');
const Veto = require('../models/veto');
const EvalRound = require('../models/evalRound');
const User = require('../models/user');
const BeatmapReport = require('../models/beatmapReport');
const Aiess = require('../models/aiess');
const cron = require('node-cron');

const defaultAppPopulate = [{
    path: 'applicant',
    select: 'username osuId',
}];

const defaultRoundPopulate = [{
    path: 'bn',
    select: 'username osuId probation',
}];

const notifyDeadlines = cron.schedule('0 0 * * *', async () => {
    // establish dates for reference
    const date = new Date();
    const nearDeadline = new Date();
    nearDeadline.setDate(nearDeadline.getDate() + 1);
    const startRange = new Date();
    startRange.setDate(startRange.getDate() + 13);
    const endRange = new Date();
    endRange.setDate(endRange.getDate() + 14);

    // find active events
    const [activeApps, activeRounds, activeVetoes] = await Promise.all([
        BnApp
            .find({
                active: true,
                test: { $exists: true },
            })
            .populate(defaultAppPopulate),

        EvalRound
            .find({ active: true })
            .populate(defaultRoundPopulate),

        Veto.find({ active: true }),
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
            if (!osuHighlight && veto.mode === 'osu') { osuHighlight = true; }

            if (!taikoHighlight && veto.mode === 'taiko') { taikoHighlight = true; }

            if (!catchHighlight && veto.mode === 'catch') { catchHighlight = true; }

            if (!maniaHighlight && veto.mode === 'mania') { maniaHighlight = true; }

            description += 'is overdue!';
        } else if (veto.deadline < nearDeadline) {
            description += 'is due in less than 24 hours!';
        }

        if (date > veto.deadline || veto.deadline < nearDeadline) {
            await api.webhookPost(
                [{
                    description,
                    color: api.webhookColors.red,
                }],
                veto.mode
            );
            await helper.sleep(500);
        }
    }

    // find and post webhook for BN applications
    for (let i = 0; i < activeApps.length; i++) {
        const app = activeApps[i];

        let addition = 7;

        if (app.discussion) { addition += 7; }

        const deadline = new Date(app.createdAt.setDate(app.createdAt.getDate() + addition));
        let description = `[**${app.applicant.username}**'s BN app](http://bn.mappersguild.com/appeval?eval=${app.id}) `;
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
            await api.webhookPost(
                [{
                    description,
                    color: api.webhookColors.red,
                }],
                app.mode
            );
            await helper.sleep(500);
        }
    }

    // find and post webhook for current BN evals
    for (let i = 0; i < activeRounds.length; i++) {
        const round = activeRounds[i];

        let description = `[**${round.bn.username}**'s current BN eval](http://bn.mappersguild.com/bneval?eval=${round.id}) `;
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
                    { $match: { group: 'nat', isSpectator: { $ne: true }, modes: round.mode, osuId: { $nin: invalids } } },
                    { $sample: { size: twoEvaluationModes.includes(round.mode) ? 2 : 3 } },
                ]);

                for (let i = 0; i < assignedNat.length; i++) {
                    let user = assignedNat[i];
                    await EvalRound.findByIdAndUpdate(round.id, { $push: { natEvaluators: user._id } });
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
            await api.webhookPost(
                [{
                    description,
                    color: api.webhookColors.red,
                }],
                round.mode
            );
            await helper.sleep(500);
        } else if (generateWebhook && natList.length) {

            await api.webhookPost(
                [{
                    description,
                    color: api.webhookColors.pink,
                    fields: [
                        {
                            name: 'Assigned NAT',
                            value: natList,
                        },
                    ],
                }],
                round.mode
            );
            await helper.sleep(500);
        }
    }

    // send highlights if needed
    if (osuHighlight) api.highlightWebhookPost('time to find a new NAT member?', 'osu');
    if (taikoHighlight) api.highlightWebhookPost('i wonder who would make the best new NAT...', 'taiko');
    if (catchHighlight) api.highlightWebhookPost('oh no', 'catch');
    if (maniaHighlight) api.highlightWebhookPost('so who is the new NAT candidate?', 'mania');
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

            let userInfo = await api.getUserInfoV1(discussion.starting_post.user_id);
            await helper.sleep(500);

            // identify modes
            let modes = [];

            if (discussion.beatmap) {
                if (discussion.beatmap.mode == 'fruits') modes.push('catch');
                else modes.push(discussion.beatmap.mode);

            } else {
                let beatmapsetInfo = await api.beatmapsetInfo(discussion.beatmapset_id, true);
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
            await api.webhookPost(
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
                    color: discussion.message_type == 'suggestion' ? api.webhookColors.lightOrange : api.webhookColors.red,
                    fields: [
                        {
                            name: discussion.message_type,
                            value: discussion.starting_post.message.length > 500 ? discussion.starting_post.message.slice(0,500) + '... *(truncated)*' : discussion.starting_post.message,
                        },
                    ],
                }],
                'beatmapReport'
            );
            await helper.sleep(500);

            // send highlights
            if (discussion.message_type == 'problem') {
                modes.forEach(mode => {
                    api.highlightWebhookPost('', `${mode}BeatmapReport`);
                });
            }
        }
    }
});

/**
 * Notify of quality assurance helper activity daily
 */
const notifyQualityAssurance = cron.schedule('0 22 * * *', async () => {
    const users = await User.find({
        $or: [
            { group: 'nat' },
            { group: 'bn' },
        ],
    }).sort({ username: 1 });

    for (let i = 0; i < users.length; i++) {
        const qualityAssuranceChecks = await Aiess.find(
            {
                qualityAssuranceCheckers: users[i].id,
            }
        );
        users[i].qualityAssuranceChecks = qualityAssuranceChecks.length;

        let recentCount = 0;
        let sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        qualityAssuranceChecks.forEach(event => {
            if (event.timestamp > sevenDaysAgo) recentCount++;
        });

        users[i].recentQualityAssuranceChecks = recentCount;
    }

    let overallUsers = [...users];
    let recentUsers = [...users];

    overallUsers.sort((a, b) => {
        if (a.qualityAssuranceChecks > b.qualityAssuranceChecks) return -1;
        if (a.qualityAssuranceChecks < b.qualityAssuranceChecks) return 1;

        return 0;
    });

    recentUsers.sort((a, b) => {
        if (a.recentQualityAssuranceChecks > b.recentQualityAssuranceChecks) return -1;
        if (a.recentQualityAssuranceChecks < b.recentQualityAssuranceChecks) return 1;

        return 0;
    });

    const modes = ['osu', 'taiko', 'catch', 'mania'];

    for (let modesIndex = 0; modesIndex < modes.length; modesIndex++) {
        const mode = modes[modesIndex];

        let topTenText = '';
        let topTenCount = 0;

        for (let i = 0; topTenCount < 10 && i < users.length; i++) {
            const user = overallUsers[i];

            if (user.modes.includes(mode) && user.qualityAssuranceChecks > 0) {
                topTenCount++;
                topTenText += `${topTenCount}. ${user.username}: **${user.qualityAssuranceChecks}**\n`;
            }
        }

        let recentText = '';
        let recentCount = '';

        for (let i = 0; recentCount < 3 && i < users.length; i++) {
            const user = recentUsers[i];

            if (user.modes.includes(mode) && user.recentQualityAssuranceChecks > 0) {
                recentCount++;
                recentText += `${recentCount}. ${user.username}: **${user.recentQualityAssuranceChecks}**\n`;
            }
        }

        await api.webhookPost(
            [{
                title: `${mode == 'osu' ? 'osu!' : 'osu!' + mode} QA activity`,
                color: api.webhookColors.lightBlue,
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
        await helper.sleep(500);
    }
});

/**
 * Checks for bns with less than 6 mods (4 for mania) the first day of every month
 */
const lowActivityTask = cron.schedule('0 23 1 * *', async () => {
    const lowActivityFields = [];
    const initialDate = new Date();
    initialDate.setMonth(initialDate.getMonth() - 3);
    console.log('from', initialDate);

    const bns = await User.find({ group: 'bn' });

    for (const bn of bns) {
        for (const mode of bn.modes) {
            if (await hasLowActivity(initialDate, bn, mode)) {
                lowActivityFields.push({
                    name: bn.username,
                    value: `${await findUniqueNominations(initialDate, bn, mode)}`,
                    inline: true,
                    mode,
                });
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
        await api.webhookPost(
            [{
                title: 'Low Activity',
                description: `The following users have low nomination activity from ${initialDate.toLocaleDateString()} to today`,
                color: api.webhookColors.red,
                fields: modeField,
            }],
            modes[i]
        );
        await helper.sleep(500);
    }
}, {
    scheduled: false,
});

async function findUniqueNominations (initialDate, bn, mode) {
    const events = await Aiess.distinct('beatmapsetId', {
        userId: bn.osuId,
        eventType: {
            $in: ['Bubbled', 'Qualified'],
        },
        timestamp: {
            $gt: initialDate,
        },
        modes: mode,
    });

    return events.length;
}

async function hasLowActivity (initialDate, bn, mode) {
    const uniqueNominations = await findUniqueNominations(initialDate, bn, mode);

    if ((uniqueNominations < 4 && mode == 'mania') ||
        (uniqueNominations < 6 && mode != 'mania')
    ) {
        return true;
    }

    return false;
}

module.exports = { notifyDeadlines, notifyBeatmapReports, lowActivityTask, notifyQualityAssurance };
