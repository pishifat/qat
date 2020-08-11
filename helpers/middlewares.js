
const User = require('../models/user');
const { refreshToken } = require('./osu');
const { setSession } = require('./util');
const { UnauthorizedError } = require('./errors');

async function isLoggedIn(req, res, next) {
    if (!req.session.mongoId) {
        if (req.accepts(['html', 'json']) !== 'json') {
            req.session.lastPage = req.originalUrl;
        }

        throw new UnauthorizedError;
    }

    const u = await User.findById(req.session.mongoId);

    if (!u) {
        return res.redirect('/');
    }

    // Refresh if less than 1 hours left for some possible edge cases
    if (new Date() > new Date(req.session.expireDate - (1 * 3600 * 1000))) {
        const response = await refreshToken(req.session.refreshToken);

        if (response.error) {
            req.session.destroy();

            return res.redirect('/');
        }

        setSession(req.session, response);
    }

    res.locals.userRequest = u;
    next();
}

function isBnOrNat(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.isBnOrNat) throw new UnauthorizedError;

    next();
}

function isNat(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.isNat) throw new UnauthorizedError;

    next();
}

function hasBasicAccess(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.hasBasicAccess) throw new UnauthorizedError;

    next();
}

function hasFullReadAccess(req, res, next) {
    const u = res.locals.userRequest;
    if (!u.hasFullReadAccess) throw new UnauthorizedError;

    next();
}

module.exports = {
    isLoggedIn,
    isBnOrNat,
    isNat,
    hasBasicAccess,
    hasFullReadAccess,
};
