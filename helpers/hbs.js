const hbs = require('hbs');

hbs.registerHelper('shortDate', (date) => {
    return date.toString().slice(4, 24);
});

hbs.registerHelper('shortAction', (action) => {
    if (action.length > 90) {
        return action.toString().slice(0, 90) + '...';
    } else {
        return action;
    }
});

hbs.registerHelper('ifCond', function(v1, v2, options) {
    if (v1 === v2) {
        return options.fn(this);
    }

    return options.inverse(this);
});

module.exports = hbs;
