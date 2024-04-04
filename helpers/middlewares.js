const User = require('../models/user');
const { refreshToken } = require('./osu');
const { setSession } = require('./util');
const { OsuResponseError } = require('./errors');
const config = require('../config.json');

function unauthorize(req, res, customError) {
    if (req.accepts(['html', 'json']) === 'json') {
        res.json({ error: customError ? customError : 'Unauthorized - Login first' });
    } else {
        res.render('index',{
            layout: false,
            loggedIn: req.session.mongoId,
        });
    }
}

async function isLoggedIn(req, res, next) {
    const u = await User.findById(req.session.mongoId);

    if (!u) {
        return unauthorize(req, res);
    }

    // Refresh if less than 1 hours left for some possible edge cases
    if (new Date() > new Date(req.session.expireDate - (1 * 3600 * 1000))) {
        const response = await refreshToken(req.session.refreshToken);

        if (response.error) {
            req.session.destroy();

            throw new OsuResponseError(response, 'Error refreshing token');
        }

        setSession(req.session, response);
    }

    res.locals.userRequest = u;
    next();
}

function isBnOrNat(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.isBnOrNat) return unauthorize(req, res);

    next();
}

function isNat(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.isNat) return unauthorize(req, res);

    next();
}

function hasBasicAccess(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.hasBasicAccess) return unauthorize(req, res);

    next();
}

function hasFullReadAccess(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.hasFullReadAccess) return unauthorize(req, res);

    next();
}

function hasFullReadAccessOrTrialNat(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.hasFullReadAccess && !u.isTrialNat) return unauthorize(req, res);

    next();
}

function isNatOrTrialNat(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.isNat && !u.isTrialNat) return unauthorize(req, res);

    next();
}

function isResponsibleWithButtons(req, res, next) {
    const u = res.locals.userRequest;
    const valid = config.admin.users;

    if (!valid.includes(u.osuId)) return unauthorize(req, res, `You can't use this`);

    next();
}

async function hasPrivateInterOpsAccess(req, res, next) {
    const u = await User.findOne({ username: req.headers.username });

    if (!u.isNat) return unauthorize(req, res, `You can't use this`);

    next();
}

async function isPishifat(req, res, next) {
    const u = res.locals.userRequest;
    if (u.osuId !== config.admin.pishifat) return unauthorize(req, res);

    next();
}

function discordEmbeds(req, res, next) {
    // skip if user is not a discord crawler
    if (req.headers["user-agent"] !== "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)")
        return next();

    const routes = [
        { path: '', title: 'BN Management' },
        { path: 'home', title: 'BN Management' },
        { path: 'bnapps', title: 'Beatmap Nominator Application' },
        { path: 'reports', title: 'Report Submission' },
        { path: 'users', title: 'BN/NAT Listing' },
        { path: 'vetoes', title: 'Vetoes' },
        { path: 'qualityassurance', title: 'Quality Assurance' },
        { path: 'yourevals', title: 'Your Evaluations' },
        { path: 'message', title: 'Message from the NAT' },
        { path: 'modrequests', title: 'Request a BN' },
        { path: 'discussionvote', title: 'Content Review' },
        { path: 'appeval', title: 'BN Application Evaluations' },
        { path: 'bneval', title: 'Current BN Evaluations' },
        { path: 'evalarchive', title: 'Evaluation Archives' },
        { path: 'managereports', title: 'Manage Reports' },
        { path: 'datacollection', title: 'Manage Resets' },
        { path: 'logs', title: 'Logs' },
        { path: 'spam', title: 'Spam' },
        { path: 'grouphistory', title: 'Group History'},
        { path: 'publicarchive', title: 'Public Evaluation Archives' },
    ];

    const route = routes.find(r => r.path === req.path.substring(1));
    const notFound = !route && req.path !== '/';

    const title = !notFound ? route.title : 'not found :(';
    const siteName = notFound || (route.path.length && route.path !== 'home') ? "BN Management" : "";
    const url = `https://bn.mappersguild.com${req.path}`;
    const description = `The place for everything related to the Beatmap Nominators${notFound ? ', not for whatever you were looking for.' : '!'}`

    const html = `<html lang="en" prefix="og: https://ogp.me/ns#">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="icon" type="image/png" href="/images/qatlogo.png">

      <meta property="og:title" content="${title}">
      ${siteName.length ? `<meta property="og:site_name" content="${siteName}">` : ''}
      <meta property="og:url" content="${url}">
      <meta property="og:description" content="${description}">
      <meta property="og:type" content="website">

      <meta name="theme-color" content="#27b6b3">
      <meta name="description" content="${description}">

      <title>${title}</title>
    </head>
  </html>`;

    res.status(notFound ? 404 : 200).send(html);
}

module.exports = {
    isLoggedIn,
    isBnOrNat,
    isNat,
    hasFullReadAccessOrTrialNat,
    isNatOrTrialNat,
    isResponsibleWithButtons,
    hasBasicAccess,
    hasFullReadAccess,
    hasPrivateInterOpsAccess,
    isPishifat,
    discordEmbeds,
};
