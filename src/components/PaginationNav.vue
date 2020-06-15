<template>
    <div class="row">
        <div class="col-sm-6 text-right">
            <button
                v-if="pagination.page > 1"
                class="btn btn-lg btn-link"
                type="button"
                @click="decreasePage"
            >
                <i class="fas fa-angle-left px-1" />
            </button>
        </div>

        <div class="col-sm-6">
            <button
                v-if="pagination.page < pagination.maxPages"
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
    },
    computed: {
        pagination () {
            return this.$store.state[this.storeModule].pagination;
        },
    },
    methods: {
        increasePage () {
            this.$store.commit(this.storeModule + '/pagination/increasePage');
        },
        decreasePage () {
            this.$store.commit(this.storeModule + '/pagination/decreasePage');
        },
    },
};
</script>