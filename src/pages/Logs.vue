<template>
    <div class="card card-body">
        <select
            id="mode"
            v-model="category"
            class="form-control mb-4"
            @change="loadCategory($event)"
        >
            <option value="all">
                All
            </option>
            <option disabled>
                ---
            </option>
            <option v-for="log in logCategories" :key="log" :value="log">
                {{ log }}
            </option>
            <option value="error">
                error
            </option>
        </select>

        <data-table
            :headers="category == 'error' ? ['date', 'user', 'action', 'stack', 'extra'] : ['date', 'user', 'action']"
        >
            <tr v-for="log in logs" :key="log.id">
                <td>
                    {{ log.createdAt }} GMT
                </td>
                <td>
                    {{ (log.user && log.user.username) || 'Anonymous' }}
                </td>
                <td>
                    {{ log.action | shorten }}
                </td>
                <td v-if="category == 'error'">
                    {{ log.stack | shorten }}
                </td>
                <td v-if="category == 'error'">
                    {{ log.extraInfo | shorten }}
                </td>
            </tr>
        </data-table>

        <div class="text-center">
            <button
                id="showMore"
                class="btn btn-sm btn-primary mb-2"
                type="button"
                @click="showMore($event)"
            >
                <i class="fas fa-angle-down mr-1" /> show more <i class="fas fa-angle-down ml-1" />
            </button>
        </div>

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';
import DataTable from '../components/DataTable.vue';

export default {
    name: 'Logs',
    components: {
        ToastMessages,
        DataTable,
    },
    data () {
        return {
            logs: [],
            skip: 300,
            logCategories: [
                'account',
                'user',
                'application',
                'appEvaluation',
                'bnEvaluation',
                'dataCollection',
                'discussionVote',
                'report',
                'test',
                'qualityAssurance',
                'veto',
                'interOp',
                'spam',
            ],
            category: 'all',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    async created () {
        const logs = await this.$http.initialRequest(`/logs/search/${this.category}/0`);

        if (!logs.error) {
            this.logs = logs;
        }
    },
    methods: {
        async loadCategory (e) {
            this.skip = 0;
            const logs = await this.$http.executeGet(`/logs/search/${this.category}/${this.skip}`, e);

            if (!logs.error) {
                this.skip += 300;
                this.logs = logs;
            }
        },
        async showMore (e) {
            const logs = await this.$http.executeGet(`/logs/search/${this.category}/${this.skip}`, e);

            if (!logs.error) {
                this.skip += 300;
                this.logs = [...this.logs, ...logs];
            }
        },
    },
};
</script>