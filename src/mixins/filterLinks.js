const filterLinks = {
    methods: {
        filterLinks (text) {
            return (text || '...').replace(
                /([^\S]|\[url\=|\(|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
                (match, space, url) => {
                    let afterHyperlink = '';
                    let hyperlink = url;
                    let renderHyperlink = url;

                    const endings = [')', ']'];

                    endings.forEach(ending => {
                        if (hyperlink.includes(ending)) {
                            const split = hyperlink.split(ending);
                            afterHyperlink = `${ending}${split[1]}`;
                            hyperlink = split[0];
                            renderHyperlink = split[0];
                        }
                    });

                    if (!hyperlink.match(/^https?:\/\//)) {
                        hyperlink = `http://${hyperlink}`;
                    }

                    return `${space}<a href="${hyperlink}" target="_blank">${renderHyperlink}</a>${afterHyperlink}`;
                }
            );
        },
    },
};

export default filterLinks;
