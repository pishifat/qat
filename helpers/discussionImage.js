const IMAGE_EXT_RE = /\.(jpeg|jpg|gif|png|webp)$/i;

function hasImageExtension(url) {
    try {
        return IMAGE_EXT_RE.test(new URL(url).pathname);
    } catch {
        return false;
    }
}

function isSulImageHost(url) {
    try {
        return new URL(url).hostname.endsWith('s-ul.eu');
    } catch {
        return false;
    }
}

function isDiscussionImageUrl(url) {
    if (!url) return false;
    return hasImageExtension(url) || isSulImageHost(url);
}

function resolveDiscussionImageUrl(url) {
    if (!url || !isDiscussionImageUrl(url)) return null;
    if (hasImageExtension(url)) return url;

    try {
        const parsed = new URL(url);
        parsed.pathname = `${parsed.pathname.replace(/\/$/, '')}.jpg`;
        return parsed.href;
    } catch {
        return null;
    }
}

module.exports = {
    hasImageExtension,
    isSulImageHost,
    isDiscussionImageUrl,
    resolveDiscussionImageUrl,
};
