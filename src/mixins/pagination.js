const pagination = {
    data() {
        return {
            pre: null,
            limit: null,
            pages: null,
            currentPage: null,
            canShowOlder: true,
        }
    },
    watch: {
        limit: function() {
            this.changePage();
        },
    },
    methods: {
		changePage: function() {
			this.limit = Math.round(this.limit);
            this.pre = this.limit - 16;
            if (this.allObjs) {
                if (this.isFiltered) {
                    if (this.limit >= this.filteredObjs.length) {
                        this.canShowOlder = false;
                    }
                    this.pageObjs = this.filteredObjs.slice(this.pre, this.limit);
                    this.pages = Math.ceil(this.filteredObjs.length / 16);
                } else {
                    if (this.limit >= this.allObjs.length) {
                        this.canShowOlder = false;
                    }
                    this.pageObjs = this.allObjs.slice(this.pre, this.limit);
                    this.pages = Math.ceil(this.allObjs.length / 16);
                }
            }
            if (this.pages > 0) {
                this.currentPage = this.limit / 16;
            } else {
                this.currentPage = this.pages;
            }
        },
        showOlder: function() {
            if (this.canShowOlder) {
                this.limit += 16;
            }
        },
        showNewer: function() {
            if (this.pre > 0) {
                this.limit -= 16;
                this.canShowOlder = true;
            }
        },
    }
}

export default pagination;
