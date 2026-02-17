export default function osuTimestamps(md, options = {}) {
    const { wrapInCode = true } = options;

    function osuTimestampsParser(state) {
        const regex = /(\d+):(\d{2}):(\d{3})\s*(\(((\d+(\|)?,?)+)\))?/gim;
        const Token = state.Token;

        state.tokens.forEach((blockToken) => {
            if (blockToken.type !== 'inline') return;

            const tokens = [];
            blockToken.children.forEach((token) => {
                if (token.type !== 'text') {
                    tokens.push(token);

                    return;
                }

                let text = token.content;
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(text)) !== null) {
                    const timestamp = match[0].trim();
                    let url = `osu://edit/${match[1]}:${match[2]}:${match[3]}`;
                    if (match[4]) url += `-${match[4]}`;

                    // push the text before the match as a text token
                    if (match.index > lastIndex) {
                        const textToken = new Token('text', '', 0);
                        textToken.content = text.slice(lastIndex, match.index);
                        tokens.push(textToken);
                    }

                    // timestamp tokens
                    const linkOpenToken = new Token('link_open', 'a', 1);
                    linkOpenToken.attrs = [['href', url]];
                    linkOpenToken.attrPush(['class', 'timestamp-link']);
                    tokens.push(linkOpenToken);

                    if (wrapInCode) {
                        const codeToken = new Token('code_inline', 'code', 0);
                        codeToken.content = timestamp;
                        codeToken.attrPush(['class', 'timestamp']);
                        tokens.push(codeToken);
                    } else {
                        const textToken = new Token('text', '', 0);
                        textToken.content = timestamp;
                        tokens.push(textToken);
                    }

                    const linkCloseToken = new Token('link_close', 'a', -1);
                    tokens.push(linkCloseToken);

                    // add a space
                    const spaceToken = new Token('text', '', 0);
                    spaceToken.content = ' ';
                    tokens.push(spaceToken);

                    lastIndex = regex.lastIndex;
                }

                // push the remaining text after the last match as a text token
                if (lastIndex < text.length) {
                    const textToken = new Token('text', '', 0);
                    textToken.content = text.slice(lastIndex);
                    tokens.push(textToken);
                }
            });

            blockToken.children = tokens;
        });
    }

    md.core.ruler.push('osu_timestamps', osuTimestampsParser);
}
