export default {
    props: {
        storeModule: {
            type: String,
            required: true,
        },
    },
    computed: {
        selectedDiscussion() {
            return this.$store.getters[`${this.storeModule}/selectedDiscussion`];
        },
    },
    methods: {
        updateDiscussionInStore(discussion) {
            this.$store.commit(`${this.storeModule}/updateDiscussion`, discussion);
        },
    },
};
