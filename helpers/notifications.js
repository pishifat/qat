const axios = require('axios');
const cheerio = require('cheerio');
const api = require('./api');
const helper = require('./helpers');
const bnAppsService = require('../models/bnApp').service;
const vetoesService = require('../models/veto').service;
const evalRoundsService = require('../models/evalRound').service;
const usersModel = require('../models/user').User;
const usersService = require('../models/user').service;
const beatmapReportsService = require('../models/beatmapReport').service;

const defaultAppPopulate = [{
    populate: 'applicant',
    display: 'username osuId',
}];

const defaultRoundPopulate = [{
    populate: 'bn',
    display: 'username osuId probation',
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
            bnAppsService.query(
                { active: true, test: { $exists: true } },
                defaultAppPopulate,
                {},
                true,
            ),
            evalRoundsService.query(
                { active: true },
                defaultRoundPopulate,
                {},
                true,
            ),
            vetoesService.query(
                { active: true },
                {},
                {},
                true,
            ),
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
                    veto.mode,
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
                    app.mode,
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
                    const assignedNat = await usersModel.aggregate([
                        { $match: { group: 'nat', isSpectator: { $ne: true }, modes: round.mode, osuId: { $nin: invalids } } },
                        { $sample: { size: round.mode == 'osu' || round.mode == 'catch' ? 3 : 2 } },
                    ]);

                    for (let i = 0; i < assignedNat.length; i++) {
                        let user = assignedNat[i];
                        await evalRoundsService.update(round.id, { $push: { natEvaluators: user._id } });
                        natList += user.username;

                        if (i + 1 < assignedNat.length) {
                            natList += ', ';
                        }
                    }
                } else {
                    for (let i = 0; i < round.natEvaluators.length; i++) {
                        let userId = round.natEvaluators[i];
                        let user = await usersService.query({ _id: userId });
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
                    round.mode,
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
                    round.mode,
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
        let beatmapReports = await beatmapReportsService.query({ createdAt: { $gte: date } }, {}, {}, true);

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
                let alreadyReported = await beatmapReportsService.query({
                    createdAt: { $gte: date },
                    beatmapsetId: discussion.beatmapset_id,
                    reporterUserId: discussion.starting_post.user_id,
                });

                if (!alreadyReported) {
                    createWebhook = true;
                }
            }

            // create event in db and send webhook
            if (createWebhook) {
                beatmapsetIds.push(discussion.beatmapset_id);
                await beatmapReportsService.create(discussion.beatmapset_id, discussion.id, discussion.starting_post.user_id);
                let userInfo = await api.getUserInfoV1(discussion.starting_post.user_id);
                await api.webhookPost(
                    [{
                        author: {
                            name: userInfo.username,
                            icon_url: `https://a.ppy.sh/${discussion.starting_post.user_id}`,
                            url: `https://osu.ppy.sh/users/${discussion.starting_post.user_id}`,
                        },
                        description: `[**${discussion.beatmapset.artist} - ${discussion.beatmapset.title}**](https://osu.ppy.sh/beatmapsets/${discussion.beatmapset_id}/discussion/-/generalAll#/${discussion.id})\nMapped by [${discussion.beatmapset.creator}](https://osu.ppy.sh/users/${discussion.starting_post.user_id})`,
                        thumbnail: {
                            url: `https://b.ppy.sh/thumb/${discussion.beatmapset_id}.jpg`,
                        },
                        color: discussion.message_type == 'suggestion' ? '16564064' : '15144231',
                        fields: [
                            {
                                name: (!discussion.beatmap ? 'general' : discussion.beatmap.mode == 'fruits' ? 'catch' : discussion.beatmap.mode) + ': ' + discussion.message_type,
                                value: discussion.starting_post.message.length > 500 ? discussion.starting_post.message + '... *(truncated)*' : discussion.starting_post.message,
                            },
                        ],
                    }],
                    'beatmapReport'
                );
                await helper.sleep(500);
                //api.highlightWebhookPost('', `${discussion.beatmap.mode}BeatmapReport`);
            }
        }


    }, 300000);
}

module.exports = { notifyDeadlines, notifyBeatmapReports };
