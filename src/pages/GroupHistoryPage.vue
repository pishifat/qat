<template>
    <div>
        <section class="card card-body">
            <div class="form-inline">
                <input
                    id="user"
                    class="form-control col-md-6"
                    type="text"
                    autocomplete="off"
                    placeholder="username or osu! ID..."
                    v-model="params.user"
                >
                <select
                    id="group"
                    class="form-control col-md-6"
                    v-model="params.group"
                >
                    <option
                        v-for="group in groups"
                        :key="group.id"
                        :value="group.identifier"
                        :selected="group.identifier === params.group"
                    >
                        {{ group.name }}
                    </option>
                </select>
                <input
                    id="min_date"
                    class="form-control col-md-6"
                    type="date"
                    data-toggle="tooltip"
                    title="start date"
                    v-model="params.min_date"
                >
                <input
                    id="max_date"
                    class="form-control col-md-6"
                    type="date"
                    data-toggle="tooltip"
                    title="end date"
                    v-model="params.max_date"
                >
                <button
                    class="btn btn-primary col-md-12 mt-3"
                    type="submit"
                    @click="search()"
                >
                Search
                </button>

            </div>
        </section>

        <section class="card card-body">
            <data-table
                :headers="['date', 'action', 'user', 'group']"
            >
            <tr v-for="event in events" :key="event.id">
                <td data-toggle="tooltip" data-placement="left" :title="event.created_at | toStandardDetailedDate">
                    {{ event.created_at | toRelativeDate }} 
                </td>
                <td>
                    <i class="mr-1 fas" :class="parseAction(event.type, 'icon')" />
                    <span>{{ parseAction(event.type, 'text') }}</span>
                </td>
                <td>
                    <a :href="'https://osu.ppy.sh/users/' + event.user_id" target="_blank">
                        {{ event.user_name }}
                    </a>
                </td>
                <td>
                    <a :href="'https://osu.ppy.sh/groups/' + event.group_id" target="_blank">
                        {{ event.group_name }}
                    </a>
                    <mode-display v-if="event.playmodes" class="ml-1" :modes="event.playmodes" />
                </td>
            </tr>
            </data-table>
            <button
                v-if="params.cursor_string"
                id="showMore"
                class="btn btn-sm btn-primary mb-2"
                type="button"
                @click="showMore($event)"
            >
                <i class="fas fa-angle-down mr-1" /> show more <i class="fas fa-angle-down ml-1" />
            </button>
        </section>
        <toast-messages />
    </div>
</template>

<script>
import DataTable from '../components/DataTable.vue';
import ModeDisplay from '../components/ModeDisplay.vue';
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'GroupHistoryPage',
    components: {
        DataTable,
        ModeDisplay,
        ToastMessages,
    },
    data() {
        return {
            events: [],
            groups: [ 
                { id: 0, identifier: null, name: 'All groups' },
                { id: 28, identifier: 'bng', name: 'Beatmap Nominators' },
                { id: 32, identifier: 'bng_limited', name: 'Beatmap Nominators (Probationary)' },
                { id: 7, identifier: 'nat', name: 'Nomination Assessment Team' },
                { id: 4, identifier: 'gmt', name: 'Global Moderation Team' },
                { id: 16, identifier: 'alumni', name: 'osu! Alumni' },
                { id: 31, identifier: 'loved', name: 'Project Loved' },
                { id: 48, identifier: 'bsc', name: 'Beatmap Spotlight Curators' },
                { id: 11, identifier: 'dev', name: 'Developers' },
                { id: 22, identifier: 'support', name: 'Technical Support Team' },
                { id: 35, identifier: 'featured_artist', name: 'Featured Artist' },
            ],
            params: {
                user: '',
                group: null,
                min_date: '',
                max_date: '',
                cursor_string: null,
            },
        };
    },
    created() {
        this.getHistory();
    },
    methods: {
        parseAction(action, type) {
            let icon = '';
            let text = '';

            switch (action) {
                case 'group_add':
                    icon = 'fa-users';
                    text = 'Added group';
                    break;
                case 'group_remove':
                    icon = 'fa-user-slash';
                    text = 'Deleted group';
                    break;
                case 'group_rename':
                    icon = 'fa-users-cog';
                    text = 'Renamed group';
                    break;
                case 'user_add':
                    icon = 'fa-plus';
                    text = 'Added user';
                    break;
                case 'user_add_with_playmodes':
                    icon = 'fa-plus';
                    text = 'Added user';
                    break;
                case 'user_add_playmodes':
                    icon = 'fa-tag';
                    text = 'Added game mode(s)';
                    break;
                case 'user_remove':
                    icon = 'fa-minus';
                    text = 'Removed user';
                    break;
                case 'user_remove_playmodes':
                    icon = 'fa-tag';
                    text = 'Removed game mode(s)';
                    break;
                case 'user_set_default':
                    icon = 'fa-cog';
                    text = 'Set default group';
                    break;
                default:
                    icon = 'fa-question';
                    text = action;
            }

            return type === 'icon' ? icon : text;
        },
        async getHistory() {
            const response = await this.$http.initialRequest('/groupHistory/get')

            if (this.params.cursor_string) {
                this.events = this.events.concat(response.data.events);
            } else {
                this.events = response.data.events;
            }

            this.params.cursor_string = response.data.cursor_string;
        },
        async showMore(e) {
            let params = '';
            for (const key in this.params) {
                if (this.params[key]) {
                    params += `${key}=${this.params[key]}&`;
                }
            }

            const response = await this.$http.executeGet(`/groupHistory/get?${params}`, e);

            if (response.data.events.length) {
                this.events = this.events.concat(response.data.events);
            } else {
                this.events = response.data.events;
            }
            this.params.cursor_string = response.data.cursor_string;
        },
        async search(e) {
            this.params.cursor_string = null;
            this.events = [];   
            await this.showMore(e)
        }
    },
};
</script>
