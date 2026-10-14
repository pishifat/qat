<template>
    <div class="card card-body">
        <div class="d-flex flex-wrap align-items-center mb-4">
            <select
                v-if="loggedInUser.isNat"
                id="mode"
                v-model="category"
                class="form-select w-auto"
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

            <select
                v-else
                id="mode"
                v-model="publicCategory"
                class="form-select w-auto"
                @change="loadCategory($event)"
            >
                <option v-for="log in publicCategories" :key="log" :value="log">
                    {{ log }}
                </option>
            </select>

            <input
                v-model="userQuery"
                type="text"
                placeholder="username or osuID..."
                maxlength="18"
                autocomplete="off"
                class="form-control w-auto ms-1"
                @keyup.enter="loadCategory($event)"
            >
            <input
                v-model="actionQuery"
                type="text"
                placeholder="action..."
                autocomplete="off"
                class="form-control w-auto ms-1"
                @keyup.enter="loadCategory($event)"
            >
            <button class="btn btn-sm btn-primary ms-2" type="button" @click="loadCategory($event)">
                Search
            </button>
        </div>

        <data-table
            :headers="category == 'error' ? ['date', 'user', 'action', 'stack', 'extra'] : category == 'all' ? ['date', 'category', 'user', 'action'] : ['date', 'user', 'action']"
        >
            <tr v-for="log in logs" :key="log.id">
                <td data-bs-toggle="tooltip" data-bs-placement="left" :title="toStandardDetailedDate(log.createdAt)">
                    {{ toRelativeDate(log.createdAt) }}
                </td>
                <td v-if="category == 'all'">
                    {{ log.category }}
                </td>
                <td>
                    {{ (log.user && log.user.username) || 'Anonymous' }}
                </td>
                <td>
                    {{ shorten(log.action) }}
                </td>
                <td v-if="category == 'error'">
                    {{ shorten(log.stack) }}
                </td>
                <td v-if="category == 'error'">
                    {{ shorten(log.extraInfo) }}
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
                <i class="fas fa-angle-down" /> show more <i class="fas fa-angle-down" />
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
                'qualityAssurance',
                'veto',
                'interOp',
                'spam',
                'notableNameChanges',
                'documentation',
                'charts',
            ],
            category: 'all',
            publicCategories: [
                'notableNameChanges',
            ],
            publicCategory: 'notableNameChanges',
            userQuery: '',
            actionQuery: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    async created () {
        const logs = await this.$http.initialRequest(this.logsUrl(0));

        if (!logs.error) {
            this.logs = logs;
        }
    },
    methods: {
        logsUrl (skip) {
            const searchMode = this.loggedInUser.isNat ? 'search' : 'public';
            const category = this.loggedInUser.isNat ? this.category : this.publicCategory;
            const params = new URLSearchParams();
            const user = this.userQuery && this.userQuery.trim();
            const action = this.actionQuery && this.actionQuery.trim();

            if (user) params.set('user', user);
            if (action) params.set('action', action);

            const query = params.toString();

            return `/logs/${searchMode}/${category}/${skip}${query ? `?${query}` : ''}`;
        },
        async loadCategory (e) {
            this.skip = 0;

            const logs = await this.$http.executeGet(this.logsUrl(this.skip), e);

            if (!logs.error) {
                this.skip += 300;
                this.logs = logs;
            }
        },
        async showMore (e) {
            const logs = await this.$http.executeGet(this.logsUrl(this.skip), e);

            if (!logs.error) {
                this.skip += 300;
                this.logs = [...this.logs, ...logs];
            }
        },
    },
};
</script>