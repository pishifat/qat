const api = require('./api');
const bnAppsService = require('../models/bnApp');
const evalRoundsService = require('../models/evalRound');

const defaultAppPopulate = {
    path: 'applicant',
    select: 'username osuId',
};

const defaultRoundPopulate = {
    path: 'bn',
    select: 'username osuId probation',
};

function notifyDeadlines() {
    setInterval(async () => {
        const date = new Date();
        const nearDeadline = new Date();
        nearDeadline.setDate(nearDeadline.getDate() + 1);

        const activeApps = await bnAppsService.query(
            { active: true, test: { $exists: true } },
            undefined,
            defaultAppPopulate,
            {},
            true,
        );

        const activeRounds = await evalRoundsService.query(
            { active: true },
            undefined,
            defaultRoundPopulate,
            {},
            true,
        );

        let osuHighlight;
        let taikoHighlight;
        let catchHighlight;
        let maniaHighlight;

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
                            url: `https://osu.ppy.sh/users/${app.applicant.osuId}`,
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
            } else if (round.deadline < nearDeadline) {
                title = `Current BN eval for ${round.bn.username} is due in less than 24 hours!`;
            }

            if (date > round.deadline || round.deadline < nearDeadline) {
                api.webhookPost(
                    [{
                        author: {
                            name: title,
                            icon_url: `https://a.ppy.sh/${round.bn.osuId}`,
                            url: `https://osu.ppy.sh/users/${round.bn.osuId}`,
                        },
                        color: '14427693',
                    }],
                    round.mode,
                );
            }
        });

        setTimeout(() => {
            if (osuHighlight) { api.highlightWebhookPost('do shit', 'osu'); }
            if (taikoHighlight) { api.highlightWebhookPost('I, bnsite, formally request you to do shit', 'taiko'); }
            if (catchHighlight) { api.highlightWebhookPost('fat yoshi', 'catch'); }
            if (maniaHighlight) { api.highlightWebhookPost('do shit', 'mania'); }
        }, 5000);

    }, 86400000);
}

module.exports = notifyDeadlines;
