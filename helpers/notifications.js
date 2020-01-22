const api = require('./api');
const bnAppsService = require('../models/bnApp').service;
const evalRoundsService = require('../models/evalRound').service;

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
        startRange.setDate(startRange.getDate() + 6);
        const endRange = new Date();
        endRange.setDate(endRange.getDate() + 7);

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
            { active: true }
        );

        let osuHighlight;
        let taikoHighlight;
        let catchHighlight;
        let maniaHighlight;

        activeVetoes.forEach((veto) => {
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
                api.webhookPost(
                    [{
                        author: {
                            name: title,
                            url: `http://bn.mappersguild.com/vetoes?beatmaps=${veto.id}`,
                        },
                        color: '16776960',
                    }],
                    veto.mode,
                );
            }
        });

        activeApps.forEach((app) => {
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

            if (date > deadline || deadline < nearDeadline) {
                api.webhookPost(
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
            }
        });

        activeRounds.forEach((round) => {
            let title = '';

            if (date > round.deadline) {
                if (!osuHighlight && round.mode === 'osu') { osuHighlight = true; }
                if (!taikoHighlight && round.mode === 'taiko') { taikoHighlight = true; }
                if (!catchHighlight && round.mode === 'catch') { catchHighlight = true; }
                if (!maniaHighlight && round.mode === 'mania') { maniaHighlight = true; }
                title = `Current BN eval for ${round.bn.username} is overdue!`;
            } else if (round.deadline < startRange && round.deadline > endRange) {
                title = `Current BN eval for ${round.bn.username} is due in one week!`;
            } else if (round.deadline < nearDeadline) {
                title = `Current BN eval for ${round.bn.username} is due in less than 24 hours!`;
            }

            if (date > round.deadline || round.deadline < nearDeadline) {
                api.webhookPost(
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
            }
        });

        setTimeout(() => {
            if (osuHighlight) { api.highlightWebhookPost('time to find a new NAT member?', 'osu'); }
            if (taikoHighlight) { api.highlightWebhookPost('i wonder who would make the best new NAT...', 'taiko'); }
            if (catchHighlight) { api.highlightWebhookPost('oh no', 'catch'); }
            if (maniaHighlight) { api.highlightWebhookPost('so who is the new NAT candidate?', 'mania'); }
        }, 5000);

    }, 86400000);
}

module.exports = notifyDeadlines;
