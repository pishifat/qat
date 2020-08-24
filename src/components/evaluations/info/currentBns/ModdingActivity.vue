<template>
    <div>
        <b>Modding:</b>
        <button
            class="btn btn-sm btn-primary mx-2 mb-2"
            data-toggle="tooltip"
            data-placement="right"
            title="Finds unique mod count in the last 90 days. Only use on BNs with low activity"
            @click="findModCount()"
        >
            Load modding activity
        </button>
        <ul v-if="modCount" class="small">
            <li v-for="(count, i) in modCount" :key="i">
                Month {{ i+1 }}: {{ count }}
            </li>
        </ul>
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';

export default {
    name: 'ModdingActivity',
    mixins: [postData],
    props: {
        username: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            modCount: null,
        };
    },
    watch: {
        username() {
            this.modCount = null;
        },
    },
    methods: {
        async findModCount() {
            this.$store.dispatch('updateToastMessages', {
                message: `Loading modding activity (this may take a while)`,
                type: 'info',
            });
            const res = await this.executeGet(`/users/findModsCount/${this.username}`);

            if (res) {
                this.modCount = res;
                this.$store.dispatch('updateToastMessages', {
                    message: `Loaded modding activity`,
                    type: 'success',
                });
            }
        },
    },
};
</script>