<template>
    <div>
        <p>
            <a :href="events && `#${eventsId}`" data-toggle="collapse">{{ header }} <i class="fas fa-angle-down" /></a>
            ({{ isLoading ? '...' : events ? events.length : '0' }})
        </p>
        <div v-if="events" :id="eventsId" class="collapse">
            <data-table
                v-if="events.length"
                :headers="['Date', 'Mapset']"
            >
                <tr v-for="event in events" :key="event.id">
                    <td class="text-nowrap">
                        {{ event.time | toMonthDay }}
                    </td>
                    <td>
                        <a :href="'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId + '/discussion/-/events'" target="_blank">
                            <mode-display
                                :modes="event.modes"
                            />

                            {{ event.artistTitle }}
                        </a>
                    </td>
                </tr>
            </data-table>
            <p v-else class="small ml-4">
                None...
            </p>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import DataTable from '../../../../DataTable.vue';
import ModeDisplay from '../../../../ModeDisplay.vue';

export default {
    name: 'EventsList',
    components: {
        DataTable,
        ModeDisplay,
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
    },
    computed: mapState('activity', [
        'isLoading',
    ]),
};
</script>