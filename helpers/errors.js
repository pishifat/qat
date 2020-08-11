class UnauthorizedError extends Error {
    status = 401;
    message = 'Unauthorized - Login first';
}

class OsuResponseError extends Error {
    constructor(response = {}, ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, OsuResponseError);
        }

        this.name = 'OsuResponseError';
        this.response = response;
        this.status = 500;
    }
}

module.exports = {
    UnauthorizedError,
    OsuResponseError,
};
