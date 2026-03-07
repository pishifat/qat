/**
 * Hex color plugin for markdown-it.
 * Syntax: {#HEX}(text) where HEX is 3 or 6 hex digits.
 */
export default function markdownItHexColor(md) {
    const hexColorRule = (state, silent) => {
        const start = state.pos;
        const src = state.src;

        if (src.slice(start, start + 2) !== '{#') return false;

        const endBrace = src.indexOf('}', start + 2);
        if (endBrace === -1) return false;

        const hex = src.slice(start + 2, endBrace);
        if (!/^[0-9A-Fa-f]{3}$/.test(hex) && !/^[0-9A-Fa-f]{6}$/.test(hex)) return false;
        if (src[endBrace + 1] !== '(') return false;

        let depth = 1;
        let pos = endBrace + 2;
        while (pos < src.length) {
            if (src[pos] === '(') depth++;
            else if (src[pos] === ')') {
                depth--;
                if (depth === 0) break;
            }
            pos++;
        }
        if (depth !== 0) return false;

        const content = src.slice(endBrace + 2, pos);

        if (!silent) {
            const token = state.push('span_open', 'span', 1);
            token.attrSet('style', 'color:#' + hex);

            state.md.inline.parse(content, state.md, state.env, state.tokens);

            state.push('span_close', 'span', -1);
        }

        state.pos = pos + 1;

        return true;
    };

    md.inline.ruler.before('emphasis', 'hex_color', hexColorRule);
}
