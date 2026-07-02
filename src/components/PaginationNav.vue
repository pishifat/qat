<template>
    <div class="row">
        <div class="col-6 text-end">
            <button
                v-if="page > 1"
                class="btn btn-lg btn-link"
                type="button"
                @click="decreasePage"
            >
                <i class="fas fa-angle-left px-1" />
            </button>
        </div>

        <div class="col-6">
            <button
                v-if="page < maxPages"
                class="btn btn-lg btn-link"
                type="button"
                @click="increasePage"
            >
                <i class="fas fa-angle-right px-1" />
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PaginationNav',
    props: {
        storeModule: {
            type: String,
            required: true,
        },
        type: String,
    },
    computed: {
        pagination () {
            return this.type ? this.$store.state[this.storeModule].evalPagination : this.$store.state[this.storeModule].pagination;
        },
        page () {
            if (this.storeModule === 'vetoes' || this.storeModule === 'contentReviews' || this.storeModule === 'discussionVotes') {
                return this.$store.state[this.storeModule].archivedPagination.page;
            }
            return this.type === 'applications' ?
                this.pagination.archivedAppsPage :
                this.type === 'evaluations' ?
                    this.pagination.archivedCurrentBnEvalsPage :
                    this.pagination.page;
        },
        maxPages () {
            if (this.storeModule === 'vetoes' || this.storeModule === 'contentReviews' || this.storeModule === 'discussionVotes') {
                return this.$store.state[this.storeModule].archivedPagination.totalPages;
            }
            return this.type === 'applications' ?
                this.pagination.archivedAppsMaxPages :
                this.type === 'evaluations' ?
                    this.pagination.archivedCurrentBnEvalsMaxPages :
                    this.pagination.maxPages;
        },
    },
    methods: {
        increasePage () {
            if (this.storeModule === 'vetoes' || this.storeModule === 'contentReviews' || this.storeModule === 'discussionVotes') {
                this.$store.commit(`${this.storeModule}/setArchivedPage`, this.page + 1);
                return;
            }
            const mutation =
                this.type === 'applications' ?
                    '/evalPagination/increaseArchivedAppsPage' :
                    this.type === 'evaluations' ?
                        '/evalPagination/increaseArchivedCurrentBnEvalsPage' :
                        '/pagination/increasePage';

            this.$store.commit(this.storeModule + mutation);
        },
        decreasePage () {
            if (this.storeModule === 'vetoes' || this.storeModule === 'contentReviews' || this.storeModule === 'discussionVotes') {
                this.$store.commit(`${this.storeModule}/setArchivedPage`, this.page - 1);
                return;
            }
            const mutation =
                this.type === 'applications' ?
                    '/evalPagination/decreaseArchivedAppsPage' :
                    this.type === 'evaluations' ?
                        '/evalPagination/decreaseArchivedCurrentBnEvalsPage' :
                        '/pagination/decreasePage';

            this.$store.commit(this.storeModule + mutation);
        },
    },
};
</script>