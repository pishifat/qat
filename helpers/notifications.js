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

function notifyDeadlines() {
    setInterval(async () => {
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
            let title = '';

            if (date > veto.deadline) {
                if (!osuHighlight && veto.mode === 'osu') { osuHighlight = true; }

                if (!taikoHighlight && veto.mode === 'taiko') { taikoHighlight = true; }

                if (!catchHighlight && veto.mode === 'catch') { catchHighlight = true; }

                if (!maniaHighlight && veto.mode === 'mania') { maniaHighlight = true; }

                title = `Veto mediation for **${veto.beatmapTitle}** is overdue!`;
            } else if (veto.deadline < nearDeadline) {
                title = `Veto mediation for **${veto.beatmapTitle}** is due in less than 24 hours!`;
            }

            if (date > veto.deadline || veto.deadline < nearDeadline) {
                await api.webhookPost(
                    [{
                        author: {
                            name: title,
                            url: `http://bn.mappersguild.com/vetoes?beatmaps=${veto.id}`,
                        },
                        color: '16776960',
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
            let title = '';

            if (date > deadline) {
                if (!osuHighlight && app.mode === 'osu') { osuHighlight = true; }

                if (!taikoHighlight && app.mode === 'taiko') { taikoHighlight = true; }

                if (!catchHighlight && app.mode === 'catch') { catchHighlight = true; }

                if (!maniaHighlight && app.mode === 'mania') { maniaHighlight = true; }

                title = `BN app eval for ${app.applicant.username} is overdue!`;
            } else if (deadline < nearDeadline) {
                title = `BN app eval for ${app.applicant.username} is due in less than 24 hours!`;
            }

            if (title.length) {
                await api.webhookPost(
                    [{
                        author: {
                            name: title,
                            icon_url: `https://a.ppy.sh/${app.applicant.osuId}`,
                            url: `http://bn.mappersguild.com/appeval?eval=${app.id}`,
                        },
                        color: '14427693',
                    }],
                    app.mode
                );
                await helper.sleep(500);
            }
        }

        // find and post webhook for current BN evals
        for (let i = 0; i < activeRounds.length; i++) {
            const round = activeRounds[i];

            let title = '';
            let natList = '';

            if (date > round.deadline) {
                if (!osuHighlight && round.mode === 'osu') { osuHighlight = true; }

                if (!taikoHighlight && round.mode === 'taiko') { taikoHighlight = true; }

                if (!catchHighlight && round.mode === 'catch') { catchHighlight = true; }

                if (!maniaHighlight && round.mode === 'mania') { maniaHighlight = true; }

                title = `Current BN eval for ${round.bn.username} is overdue!`;
            } else if (round.deadline < nearDeadline) {
                title = `Current BN eval for ${round.bn.username} is due in less than 24 hours!`;
            } else if (round.deadline > startRange && round.deadline < endRange) {
                title = `Current BN eval for ${round.bn.username} is due in two weeks!`;

                if (!round.natEvaluators || !round.natEvaluators.length) {
                    const invalids = [8129817, 3178418];
                    const assignedNat = await User.aggregate([
                        { $match: { group: 'nat', isSpectator: { $ne: true }, modes: round.mode, osuId: { $nin: invalids } } },
                        { $sample: { size: round.mode == 'osu' || round.mode == 'catch' ? 3 : 2 } },
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

            if (title.length && !natList.length) {
                await api.webhookPost(
                    [{
                        author: {
                            name: title,
                            icon_url: `https://a.ppy.sh/${round.bn.osuId}`,
                            url: `http://bn.mappersguild.com/bneval?eval=${round.id}`,
                        },
                        color: '14427693',
                    }],
                    round.mode
                );
                await helper.sleep(500);
            } else if (title.length && natList.length) {

                await api.webhookPost(
                    [{
                        author: {
                            name: title,
                            icon_url: `https://a.ppy.sh/${round.bn.osuId}`,
                            url: `http://bn.mappersguild.com/bneval?eval=${round.id}`,
                        },
                        color: '15711602',
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

    }, 86400000);
}

function notifyBeatmapReports() {
    setInterval(async () => {
        // find pending discussion posts
        let url = 'https://osu.ppy.sh/beatmapsets/beatmap-discussions?user=&beatmapset_status=qualified&message_types%5B%5D=suggestion&message_types%5B%5D=problem&only_unresolved=on';
        const historyHtml = await axios.get(url);
        const $ = cheerio.load(historyHtml.data);
        let discussions = JSON.parse($('#json-discussions').html());

        // find database's discussion posts
        const date = new Date();
        date.setDate(date.getDate() - 7);
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
                let beatmapsetInfo = await api.beatmapsetInfo(discussion.beatmapset_id, true);
                let modes = [];
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

                // send webhook
                await api.webhookPost(
                    [{
                        author: {
                            name: userInfo.username,
                            icon_url: `https://a.ppy.sh/${discussion.starting_post.user_id}`,
                            url: `https://osu.ppy.sh/users/${discussion.starting_post.user_id}`,
                        },
                        description: `[**${discussion.beatmapset.artist} - ${discussion.beatmapset.title}**](https://osu.ppy.sh/beatmapsets/${discussion.beatmapset_id}/discussion/-/generalAll#/${discussion.id})\nMapped by [${discussion.beatmapset.creator}](https://osu.ppy.sh/users/${discussion.starting_post.user_id}) [**${modes.join(', ')}**]`,
                        thumbnail: {
                            url: `https://b.ppy.sh/thumb/${discussion.beatmapset_id}.jpg`,
                        },
                        color: discussion.message_type == 'suggestion' ? '16564064' : '15144231',
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
                    if (discussion.beatmap) {
                        let mode = discussion.beatmap.mode;
                        if (mode == 'fruits') mode = 'catch';
                        api.highlightWebhookPost('', `${mode}BeatmapReport`);
                    } else {
                        modes.forEach(mode => {
                            api.highlightWebhookPost('', `${mode}BeatmapReport`);
                        });
                    }
                }
            }
        }


    }, 300000);
}

/**
 * Checks for bns with less than 6 mods (4 for mania) the first day every 2 months
 */
const lowActivityTask = cron.schedule('0 0 1 */2 *', async () => {
    const lowActivityFields = [];
    const initialDate = new Date();
    initialDate.setMonth(initialDate.getMonth() - 2);
    console.log('from', initialDate);

    const bns = await User.find({ group: 'bn' });

    for (const bn of bns) {
        for (const mode of bn.modes) {
            if (hasLowActivity(initialDate, bn, mode)) {
                lowActivityFields.push({
                    name: mode,
                    value: `[${bn.username}](https://osu.ppy.sh/users/${bn.osuId})`,
                    inline: true,
                });
            }
        }

        for (const mode of bn.probation) {
            if (hasLowActivity(initialDate, bn, mode)) {
                lowActivityFields.push({
                    name: mode,
                    value: `[${bn.username}](https://osu.ppy.sh/users/${bn.osuId})`,
                    inline: true,
                });
            }
        }
    }

    if (!lowActivityFields.length) return;

    const embeds = [];

    for (let i = 0; i < lowActivityFields.length; i += 24) {
        if (i == 0) {
            embeds.push({
                title: 'Low Activity',
                description: `The following users have low activity from ${initialDate.toLocaleDateString()} to this date`,
                color: '14427693',
                fields: lowActivityFields.slice(i, i + 24),
            });
        } else {
            embeds.push({
                color: '14427693',
                fields: lowActivityFields.slice(i, i + 24),
            });
        }
    }

    // await api.webhookPost(embeds, 'natwebhookidkwhichoneitis');
}, {
    scheduled: false,
});

async function hasLowActivity (initialDate, bn, mode) {
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

    if ((events.length < 4 && mode == 'mania') ||
        (events.length < 6 && mode != 'mania')
    ) {
        return true;
    }

    return false;
}

module.exports = { notifyDeadlines, notifyBeatmapReports, lowActivityTask };
