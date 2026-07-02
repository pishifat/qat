/**
 * Legacy ?id= query redirect for discussion/content-review links.
 */
export default async function discussionLegacyRedirect(to, from, next) {
    const id = to.query.id;
    if (!id) {
        next();
        return;
    }

    try {
        const res = await fetch(`/api/v2/discussions/${id}/resolve`, { credentials: 'include' });
        const data = await res.json();
        if (data.path) {
            next({ path: data.path, replace: true });
        } else {
            next();
        }
    } catch {
        next();
    }
}
