const pagination = {
    data() {
        return {
            limit: 24,
        }
    },
    watch: {
        limit: function() {
            if (this.allObjs) this.pageObjs = this.allObjs.slice(0, this.limit);
        },
        allObjs: function() {
            if (this.allObjs) this.pageObjs = this.allObjs.slice(0, this.limit);
        },
    },
    methods: {
        scroll: function() {
            window.onscroll = () => {
                let scrolled = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                if (scrolled + window.innerHeight === document.documentElement.offsetHeight) {
                    this.limit += 16;
                }
            }
        },
    },
    mounted() {
        this.scroll();
    }
}

export default pagination;
