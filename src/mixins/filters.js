const filters = {
    data() {
        return {
            filterValue: '',
            filterMode: '',
            filterVote: '',
            isFiltered: false,
            hasPagination: true,
            hasSeparation: false,

            sortBy: null,
            asc: false,
        };
    },
    watch: {
        filterValue: function() {
            this.filter();
        },
        filterMode: function() {
            this.filter();
        },
        filterVote: function() {
            this.filter();
        },
    },
    methods: {
        filter: function() {
            this.pageObjs = this.allObjs;

            this.filterByMode();
            this.filterByVote();
            this.filterBySearchValue();

            this.isFiltered = this.filterValue.length > 2 || this.filterMode.length || this.filterVote.length;
            if (this.sortBy) {
                this.sort(this.sortBy, true);
            }

            if (this.hasPagination) {
                this.limit = (this.count + 0.01); //resets to first page
                this.canShowOlder = true;
            } else {
                if (this.isFiltered) this.pageObjs = this.filteredObjs;
                else this.pageObjs = this.allObjs;
            }
            if (this.hasSeparation) {
                this.separateObjs();
            }
        },
        filterByMode: function() {
            if (this.filterMode.length) {
                this.filteredObjs = this.allObjs.filter(v => {
                    if (this.filterMode == 'osu' && ((v.mode && v.mode.indexOf('osu') !== -1) || (v.modes && v.modes.indexOf('osu') !== -1))) {
                        return true;
                    }
                    if (this.filterMode == 'taiko' && ((v.mode && v.mode.indexOf('taiko') !== -1) || (v.modes && v.modes.indexOf('taiko') !== -1))) {
                        return true;
                    }
                    if (this.filterMode == 'catch' && ((v.mode && v.mode.indexOf('catch') !== -1) || (v.modes && v.modes.indexOf('catch') !== -1))) {
                        return true;
                    }
                    if (this.filterMode == 'mania' &&  ((v.mode && v.mode.indexOf('mania') !== -1) || (v.modes && v.modes.indexOf('mania') !== -1))) {
                        return true;
                    }
                    return false;
                });
            }
        },
        filterByVote: function() {
            if (this.filterVote.length) {
                if(this.filterMode.length){
                    this.filteredObjs = this.filteredObjs.filter(v => {
                        if (v.valid == this.filterVote) {
                            return true;
                        }
                        if (this.filterVote == 'none' && !v.valid && !v.vote) {
                            return true;
                        }
                        return false;
                    });
                }else{
                    this.filteredObjs = this.allObjs.filter(v => {
                        if (v.valid == this.filterVote) {
                            return true;
                        }
                        if (this.filterVote == 'none' && !v.valid && !v.vote) {
                            return true;
                        }
                        return false;
                    });
                }
            }
        },
        filterBySearchValue: function() {
            if (this.filterValue.length > 2) {
                if (this.filterMode.length || this.filterVote.length) {
                    this.filteredObjs = this.allObjs.filter(o => {
                        return this.filterBySearchValueContext(o);
                    });
                } else {
                    this.filteredObjs = this.allObjs.filter(o => {
                        return this.filterBySearchValueContext(o);
                    });
                }
            }
        },
        
        
        sort: function (field, keepOrder) {
            this.sortBy = field;
            if (!keepOrder) {
                this.asc = !this.asc;
            }
            if (this.sortBy == 'username') {
                if(this.isFiltered){
                    this.filteredObjs.sort((a, b) => {
                        if (this.asc) {
                            return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
                        } else {
                            return b.username.toLowerCase().localeCompare(a.username.toLowerCase());
                        }
                    });
                }else{
                    this.allObjs.sort((a, b) => {
                        if (this.asc) {
                            return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
                        } else {
                            return b.username.toLowerCase().localeCompare(a.username.toLowerCase());
                        }
                    });
                }
            } else if (this.sortBy == 'createdAt') {
                if(this.isFiltered){
                    this.filteredObjs.sort((a, b) => {
                        if (this.asc) {
                            if (a.createdAt > b.createdAt) return 1;
                            if (a.createdAt < b.createdAt) return -1;
                        } else {
                            if (a.createdAt < b.createdAt) return 1;
                            if (a.createdAt > b.createdAt) return -1;
                        }
                        return 0;
                    });
                }else{
                    this.allObjs.sort((a, b) => {
                        if (this.asc) {
                            if (a.createdAt > b.createdAt) return 1;
                            if (a.createdAt < b.createdAt) return -1;
                        } else {
                            if (a.createdAt < b.createdAt) return 1;
                            if (a.createdAt > b.createdAt) return -1;
                        }
                        return 0;
                    });
                }
                
            } else if (this.sortBy == 'bnDuration') {
                if(this.isFiltered){
                    this.filteredObjs.sort((a, b) => {
                        if (this.asc) {
                            if (this.sortDuration(a.bnDuration) > this.sortDuration(b.bnDuration)) return -1;
                            if (this.sortDuration(a.bnDuration) < this.sortDuration(b.bnDuration)) return 1;
                        } else {
                            if (this.sortDuration(a.bnDuration) < this.sortDuration(b.bnDuration)) return -1;
                            if (this.sortDuration(a.bnDuration) > this.sortDuration(b.bnDuration)) return 1;
                        }
                        return 0;
                    });
                }else{
                    this.allObjs.sort((a, b) => {
                        if (this.asc) {
                            if (this.sortDuration(a.bnDuration) > this.sortDuration(b.bnDuration)) return -1;
                            if (this.sortDuration(a.bnDuration) < this.sortDuration(b.bnDuration)) return 1;
                        } else {
                            if (this.sortDuration(a.bnDuration) < this.sortDuration(b.bnDuration)) return -1;
                            if (this.sortDuration(a.bnDuration) > this.sortDuration(b.bnDuration)) return 1;
                        }
                        return 0;
                    });
                }
            } else if (this.sortBy == 'natDuration') {
                if(this.isFiltered){
                    this.filteredObjs.sort((a, b) => {
                        if (this.asc) {
                            if (this.sortDuration(a.natDuration) > this.sortDuration(b.natDuration)) return -1;
                            if (this.sortDuration(a.natDuration) < this.sortDuration(b.natDuration)) return 1;
                        } else {
                            if (this.sortDuration(a.natDuration) < this.sortDuration(b.natDuration)) return -1;
                            if (this.sortDuration(a.natDuration) > this.sortDuration(b.natDuration)) return 1;
                        }
                        return 0;
                    });
                }else{
                    this.allObjs.sort((a, b) => {
                        if (this.asc) {
                            if (this.sortDuration(a.natDuration) > this.sortDuration(b.natDuration)) return -1;
                            if (this.sortDuration(a.natDuration) < this.sortDuration(b.natDuration)) return 1;
                        } else {
                            if (this.sortDuration(a.natDuration) < this.sortDuration(b.natDuration)) return -1;
                            if (this.sortDuration(a.natDuration) > this.sortDuration(b.natDuration)) return 1;
                        }
                        return 0;
                    });
                }
            }

            if (this.hasPagination) {
                this.limit = (this.count + 0.01);
                this.canShowOlder = true;
            }
        },
    },
};

export default filters;
