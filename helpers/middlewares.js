
const User = require('../models/user');
const { refreshToken } = require('./osu');

async function isLoggedIn(req, res, next) {
    if (req.session.mongoId) {
        const u = await User.findById(req.session.mongoId);

        if (!u) {
            return res.redirect('/');
        }

        // Refresh if less than 10 hours left
        if (new Date() > new Date(req.session.expireDate - (10 * 3600 * 1000))) {
            const response = await refreshToken(req.session.refreshToken);

            if (!response || response.error) {
                req.session.destroy();
                res.redirect('/');
            }

            // *1000 because maxAge is miliseconds, oauth is seconds
            req.session.cookie.maxAge = response.expires_in * 2 * 1000;
            req.session.expireDate = Date.now() + (response.expires_in * 1000);
            req.session.accessToken = response.access_token;
            req.session.refreshToken = response.refresh_token;
        }

        res.locals.userRequest = u;
        next();
    } else {
        if (req.accepts(['html', 'json']) === 'html') {
            req.session.lastPage = req.originalUrl;
            res.redirect('/');
        } else {
            res.json({
                error: 'Unauthorized',
            });
        }
    }
}

function isBnOrNat(req, res, next) {
    const u = res.locals.userRequest;

    if (u.isBnOrNat) {
        next();
    } else {
        if (req.accepts(['html', 'json']) === 'html') {
            res.redirect('/');
        } else {
            res.json({
                error: 'Unauthorized',
            });
        }
    }
}

function isNat(req, res, next) {
    const u = res.locals.userRequest;

    if (u.isNat) {
        next();
    } else {
        if (req.accepts(['html', 'json']) === 'html') {
            res.redirect('/');
        } else {
            res.json({
                error: 'Unauthorized',
            });
        }
    }
}

function hasBasicAccess(req, res, next) {
    const u = res.locals.userRequest;

    if (u.hasBasicAccess) {
        next();
    } else {
        if (req.accepts(['html', 'json']) === 'html') {
            res.redirect('/');
        } else {
            res.json({
                error: 'Unauthorized',
            });
        }
    }
}

function hasFullReadAccess(req, res, next) {
    const u = res.locals.userRequest;

    if (u.hasFullReadAccess) {
        next();
    } else {
        if (req.accepts(['html', 'json']) === 'html') {
            res.redirect('/');
        } else {
            res.json({
                error: 'Unauthorized',
            });
        }
    }
}

module.exports = {
    isLoggedIn,
    isBnOrNat,
    isNat,
    hasBasicAccess,
    hasFullReadAccess,
};
