<template>
    <div class="card card-body">
        <template v-if="loggedInUser.osuId == 1052994 || loggedInUser.osuId == 3178418">
            <a class="btn btn-primary mb-2" data-toggle="collapse" href="#collapseErrors">
                Show errors
            </a>

            <data-table
                id="collapseErrors"
                :headers="['date', 'user', 'action', 'stack', 'extra']"
            >
                <tr v-for="log in errors" :key="log.id">
                    <td>
                        {{ log.createdAt }} GMT
                    </td>
                    <td>
                        {{ (log.user && log.user.username) || 'Anonymous' }}
                    </td>
                    <td>
                        {{ log.action | shorten }}
                    </td>
                    <td>
                        {{ log.stack | shorten }}
                    </td>
                    <td>
                        {{ log.extraInfo | shorten }}
                    </td>
                </tr>
            </data-table>

            <hr>
        </template>

        <data-table
            :headers="['date', 'user', 'action']"
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
import postData from '../mixins/postData';
import ToastMessages from '../components/ToastMessages.vue';
import DataTable from '../components/DataTable.vue';

export default {
    name: 'Logs',
    components: {
        ToastMessages,
        DataTable,
    },
    mixins: [ postData ],
    data () {
        return {
            logs: [],
            errors: [],
            skip: 100,
        };
    },
    computed: mapState([
        'loggedInUser',
    ]),
    async created () {
        const data = await this.initialRequest(`/logs/search`);

        if (!data.error) {
            this.logs = data.logs;
            this.errors = data.errors;
        }
    },
    methods: {
        async showMore (e) {
            const data = await this.executeGet(`/logs/search?skip=${this.skip}`, e);

            if (!data.error) {
                this.skip += 100;
                this.logs = [...this.logs, ...data.logs];
            }
        },
    },
};
</script>