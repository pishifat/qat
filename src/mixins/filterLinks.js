const filterLinks = {
    methods: {
        filterLinks: function (text) {
            console.log('test')
            return (text || "...").replace(
                /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
                function(match, space, url){
                    var hyperlink = url;
                    if (!hyperlink.match('^https?:\/\/')) {
                        hyperlink = 'http://' + hyperlink;
                    }
                    return space + '<a href="' + hyperlink + '" target="_blank">' + url + '</a>';
                }
            );
        },
    }
}

export default filterLinks;
