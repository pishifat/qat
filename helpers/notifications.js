const api = require('./api');
const helper = require('./helpers');
const bnAppsService = require('../models/bnApp').service;
const vetoesService = require('../models/veto').service;
const evalRoundsService = require('../models/evalRound').service;
const usersModel = require('../models/user').User;

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
        const date = new Date();
        const nearDeadline = new Date();
        nearDeadline.setDate(nearDeadline.getDate() + 1);
        const startRange = new Date();
        startRange.setDate(startRange.getDate() + 13);
        const endRange = new Date();
        endRange.setDate(endRange.getDate() + 14);

        const activeApps = await bnAppsService.query(
            { active: true, test: { $exists: true } },
            defaultAppPopulate,
            {},
            true,
        );

        const activeRounds = await evalRoundsService.query(
            { active: true },
            defaultRoundPopulate,
            {},
            true,
        );

        const activeVetoes = await vetoesService.query(
            { active: true },
            {},
            {},
            true,
        );

        let osuHighlight;
        let taikoHighlight;
        let catchHighlight;
        let maniaHighlight;

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
                        if(i + 1 < assignedNat.length){
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
                        fields:[
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

        if (osuHighlight) api.highlightWebhookPost('time to find a new NAT member?', 'osu');
        if (taikoHighlight) api.highlightWebhookPost('i wonder who would make the best new NAT...', 'taiko');
        if (catchHighlight) api.highlightWebhookPost('oh no', 'catch');
        if (maniaHighlight) api.highlightWebhookPost('so who is the new NAT candidate?', 'mania');

    }, 86400000);
}

module.exports = notifyDeadlines;
