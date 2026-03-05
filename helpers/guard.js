/**
 * Sanitize an object (or array of objects) by hiding attributes when a condition is not met.
 * Callers pass an arbitrary boolean (e.g. permission check or compound assertion); when it is
 * false, the listed attributes are removed from the output.
 *
 * Attributes may be top-level ("key") or nested ("path.key"): for nested, the key is
 * removed from each element of out[path] if it's an array, or from out[path] if it's an object.
 *
 * @param {Object} options
 * @param {Object|Object[]} options.data - Document(s) to sanitize (plain or Mongoose doc)
 * @param {boolean} options.allowed - If true, no attributes are removed. If false, options.attributes are stripped.
 * @param {string[]} options.attributes - Attribute names to remove when allowed is false (top-level or "path.key").
 * @returns {Object|Object[]} Plain object(s); when allowed is false, guarded attributes are removed
 */
function guard({ data, allowed, attributes }) {
    if (!data || allowed || !Array.isArray(attributes) || attributes.length === 0) {
        if (!data) return data;

        const toPlain = (o) => (o && typeof o.toObject === 'function' ? o.toObject() : { ...o });

        return Array.isArray(data) ? data.map(toPlain) : toPlain(data);
    }

    const toPlain = (o) => (o && typeof o.toObject === 'function' ? o.toObject() : { ...o });

    function deleteAttribute(out, attr) {
        const dotIndex = attr.indexOf('.');

        if (dotIndex === -1) {
            delete out[attr];

            return;
        }

        const path = attr.slice(0, dotIndex);
        const key = attr.slice(dotIndex + 1);
        const parent = out[path];

        if (Array.isArray(parent)) {
            out[path] = parent.map((item) => {
                const copy = item && typeof item === 'object' ? { ...item } : item;

                if (copy && typeof copy === 'object') delete copy[key];

                return copy;
            });
        } else if (parent && typeof parent === 'object' && !Array.isArray(parent)) {
            delete parent[key];
        }
    }

    const sanitizeOne = (item) => {
        const out = toPlain(item);

        for (const attr of attributes) {
            deleteAttribute(out, attr);
        }

        return out;
    };

    if (Array.isArray(data)) {
        return data.map(sanitizeOne);
    }

    return sanitizeOne(data);
}

module.exports = {
    guard,
};
