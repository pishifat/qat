<template>
    <div>
        <div class="ml-2">
            <a :href="events && `#${eventsId}`" data-toggle="collapse"
                >{{ header }} <i class="fas fa-angle-down"
            /></a>
            ({{ isLoading ? '...' : events ? filteredEvents.length : '0' }})
        </div>
        <div v-if="events" :id="eventsId" class="collapse">
            <data-table
                v-if="filteredEvents.length"
                :headers="['Date', 'Mapset', 'Reason']"
            >
                <tr v-for="event in filteredEvents" :key="event._id">
                    <td class="text-nowrap">
                        {{ event.timestamp | toMonthDayYear }}
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
                        <span
                            v-if="event.beatmaps && event.beatmaps.length"
                            class="text-secondary small"
                            data-toggle="tooltip"
                            data-placement="right"
                            :title="event.validated ? 'total drain time' : 'total drain time, not yet validated'"
                        >
                            ({{ totalDrain(event.beatmaps)}}{{ event.validated ? '' : '*' }})
                        </span>
                    </td>
                    <nomination-reset-editing :event="event" />
                </tr>
            </data-table>
            <p v-else class="small ml-4">None...</p>
            <div 
                v-if="events && events.length && (eventsId == 'nominationsDisqualified' || eventsId == 'nominationsPopped')"
                class="text-secondary small"
            >
                <div>This list {{ filter ? 'excludes' : 'includes' }} <a href="https://osu.ppy.sh/wiki/en/People/The_Team/Nomination_Assessment_Team/SEV_rating" target="_blank">insignificant resets (0/0)</a>.</div>
                <button
                    class="btn btn-sm btn-primary mb-2"
                    @click="filter = !filter"
                >
                    {{ `${filter == true ? 'Show' : 'Hide'} insignificant disqualifications/resets` }}
                </button>
            </div>
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
    data () {
        return {
            filter: this.eventsId == 'nominationsDisqualified' || this.eventsId == 'nominationsPopped',
        };
    },
    computed: {
        ...mapState('activity', ['isLoading']),
        filteredEvents () {
            let events = [...this.events];

            if (this.filter) {
                events = events.filter(e => {
                    if (e.obviousness == 0 && e.severity == 0) {
                        return false;
                    }

                    return true;
                });
            }

            return events;
        },
    },
    methods: {
        totalDrain(beatmaps) {
            let drain = 0;

            for (const beatmap of beatmaps) {
                drain += beatmap.drain;
            }

            const seconds = drain % 60;
            const minutes = (drain - seconds)/60

            return minutes + ":" + seconds;
        },
    }
};
</script>