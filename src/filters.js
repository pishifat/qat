import moment from 'moment';

export function toStandardDate (date) {
    if (!date) return '';

    return moment(new Date(date)).format('YYYY-MM-DD');
}

export function toMonthDayYear (date) {
    if (!date) return '';

    return moment(new Date(date)).format('MMM DD, YYYY');
}

export function toStandardDetailedDate (date) {
    if (!date) return '';

    return moment(new Date(date)).format('YYYY-MM-DD hh:mm:ss A');
}

export function toRelativeDate (date) {
    if (!date) return '';

    return moment(new Date(date)).locale('en').fromNow();
}

export function toRelativeShortDate (date) {
    if (!date) return '';

    return moment(new Date(date)).locale('short').fromNow();
}

export function shorten (text, length) {
    if (!text) return '';

    length = length || 90;

    if (text.length > length) {
        return text.toString().slice(0, length) + '...';
    } else {
        return text;
    }
}

export function formatMode (mode) {
    if (!mode) return '';

    if (mode == 'none') return 'structural';
    else if (mode == 'osu') return 'osu!';
    else return 'osu!' + mode;
}
