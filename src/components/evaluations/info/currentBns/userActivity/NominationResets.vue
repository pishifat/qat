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
                :headers="['Date', 'Mapset', 'Reason']"
            >
                <tr v-for="event in events" :key="event._id">
                    <td class="text-nowrap">
                        {{ event.timestamp | toMonthDay }}
                    </td>
                    <td class="w-25">
                        <a
                            :href="
                                event.discussionId
                                    ? 'https://osu.ppy.sh/beatmapsets/' +
                                      event.beatmapsetId +
                                      '/discussion/-/generalAll#/' +
                                      event.discussionId
                                    : 'https://osu.ppy.sh/beatmapsets/' +
                                      event.beatmapsetId +
                                      '/discussion/-/events'
                            "
                            target="_blank"
                        >
                            <mode-display :modes="event.modes" />

                            {{ event.artistTitle }}
                        </a>
                    </td>
                    <nomination-reset-editing :event="event" />
                </tr>
            </data-table>
            <p v-else class="small ml-4">None...</p>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import NominationResetEditing from './NominationResetEditing.vue';
import DataTable from '../../../../DataTable.vue';
import ModeDisplay from '../../../../ModeDisplay.vue';

export default {
    name: 'NominationResets',
    components: {
        NominationResetEditing,
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
        eventsId: {
            type: String,
            required: true,
        },
        header: {
            type: String,
            required: true,
        },
    },
    computed: mapState('activity', ['isLoading']),
};
</script>