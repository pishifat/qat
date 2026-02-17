<template>
    <div class="row">
        <div class="col-6 text-right">
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
            return this.type === 'applications' ?
                this.pagination.archivedAppsPage :
                this.type === 'evaluations' ?
                    this.pagination.archivedCurrentBnEvalsPage :
                    this.pagination.page;
        },
        maxPages () {
            return this.type === 'applications' ?
                this.pagination.archivedAppsMaxPages :
                this.type === 'evaluations' ?
                    this.pagination.archivedCurrentBnEvalsMaxPages :
                    this.pagination.maxPages;
        },
    },
    methods: {
        increasePage () {
            const mutation =
                this.type === 'applications' ?
                    '/evalPagination/increaseArchivedAppsPage' :
                    this.type === 'evaluations' ?
                        '/evalPagination/increaseArchivedCurrentBnEvalsPage' :
                        '/pagination/increasePage';

            this.$store.commit(this.storeModule + mutation);
        },
        decreasePage () {
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