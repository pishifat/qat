
const User = require('../models/user');
const { refreshToken } = require('./osu');
const { setSession } = require('./util');
const { OsuResponseError } = require('./errors');

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
    const valid = [3178418, 1541323];

    if (!valid.includes(u.osuId)) return unauthorize(req, res, `You can't use this`);

    next();
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
};
