<template>
    <div>
        <div class="ml-2">
            <a :href="events && `#${eventsId}`" data-toggle="collapse"
                >{{ header }} <i class="fas fa-angle-down"
            /></a>
            ({{ isLoading ? '...' : events ? events.length : '0' }})
        </div>

        <div v-if="events" :id="eventsId" class="collapse">
            <data-table
                v-if="events.length"
                :headers="['Date', 'Evaluated User']"
            >
                <tr v-for="event in events" :key="event.id">
                    <td class="text-nowrap">
                        {{ new Date(event.deadline).toString().slice(4, 10) }}
                    </td>
                    <td>
                        <user-link
                            :username="event.user.username"
                            :osu-id="event.user.osuId"
                        />
                    </td>
                </tr>
            </data-table>
            <p v-else class="small ml-4">None...</p>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import DataTable from '../../../../DataTable.vue';
import UserLink from '../../../../UserLink.vue';

export default {
    name: 'EvaluationList',
    components: {
        DataTable,
        UserLink,
    },
    props: {
        events: {
            type: Array,
            default() {
                return [];
            },
        },
        header: {
            type: String,
            required: true,
        },
        eventsId: {
            type: String,
            required: true,
        },
        mongoId: {
            type: String,
            required: true,
        },
        isApplication: Boolean,
    },
    computed: {
        ...mapState('activity', ['isLoading']), 
        ...mapState(['loggedInUser']),
    },
};
</script>