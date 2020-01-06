const filterLinks = {
    methods: {
        filterLinks (text) {
            return (text || '...').replace(
                /([^\S]|\[url\=|\(|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
                (match, space, url) => {
                    let afterHyperlink = '';
                    let hyperlink = url;

                    const ending = url.match(/[\)\]\}]*/g)
                        .filter(x => x != '')[0];

                    if (ending) {
                        const endingIndex = url.indexOf(ending);
                        hyperlink = '';

                        for (let i = 0; i < endingIndex; i++) {
                            hyperlink += url[i];
                        }

                        afterHyperlink = url.replace(hyperlink, '');
                    }

                    if (!hyperlink.match(/^https?:\/\//)) {
                        hyperlink = `http://${hyperlink}`;
                    }

                    return `${space}<a href="${hyperlink}" target="_blank">${hyperlink}</a>${afterHyperlink}`;
                }
            );
        },
    },
};

export default filterLinks;
