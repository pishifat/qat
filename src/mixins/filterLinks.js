const filterLinks = {
    methods: {
        filterLinks (text) {
            return (text || '...').replace(
                /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
                function(match, space, url){
                    let hyperlink = url;
                    if (!hyperlink.match('^https?:\/\/')) {
                        hyperlink = 'http://' + hyperlink;
                    }
                    return space + '<a href="' + hyperlink + '" target="_blank">' + url + '</a>';
                }
            );
        },
    },
};

export default filterLinks;
