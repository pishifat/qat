<template>
    <div>
        <div class="ml-2">
            <a :href="events && `#${eventsId}`" data-toggle="collapse"
                >{{ header }} <i class="fas fa-angle-down"
            /></a>
            ({{ isLoading ? '...' : events ? filteredEvents.length : '0' }})
        </div>
        <div v-if="events" :id="eventsId" class="collapse overflow-auto text-break">
            <div 
                v-if="loggedInUser && loggedInUser.isNatOrTrialNat && events && events.length && (eventsId == 'nominationsDisqualified' || eventsId == 'nominationsPopped')"
                class="text-secondary small"
            >
                <button
                    class="btn btn-sm btn-primary mb-2"
                    @click="filter = !filter"
                >
                    {{ `${filter == true ? 'Show' : 'Hide'} 0/0 SEV events` }}
                </button>
            </div>
            <data-table
                v-if="filteredEvents.length"
                :headers="['Date', 'Mapset', 'Reason']"
            >
                <tr v-for="event in filteredEvents" :key="event._id">
                    <td class="text-nowrap">
                        {{ toMonthDayYear(event.timestamp) }}
                    </td>
                    <td class="w-25">
                        <a 
                            :href="'osu://dl/' + event.beatmapsetId"
                            data-toggle="tooltip"
                            data-placement="right"
                            title="osu!direct download"
                        >
                            <i class="fas fa-file-download mr-1" />
                        </a>
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
                            title="total drain time"
                        >
                            ({{ totalDrain(event.beatmaps) }})
                        </span>
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
    data () {
        return {
            filter: this.eventsId == 'nominationsDisqualified' || this.eventsId == 'nominationsPopped',
        };
    },
    computed: {
        ...mapState('activity', ['isLoading']),
        ...mapState([
            'loggedInUser',
        ]),
        filteredEvents () {
            let events = [...this.events];

            if (this.filter && this.loggedInUser && this.loggedInUser.isNatOrTrialNat) {
                events = events.filter(e => {
                    if (e.obviousness == 0 && e.severity == 0) {
                        return false;
                    }

                    if (e.impactNum == 0 && e.obviousness === undefined && e.severity === undefined) { // events marked as "minor" later had SEV assigned as 1/0, and NAT wanted them to appear
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

            const rawSeconds = drain % 60;
            const seconds = rawSeconds > 9 ? rawSeconds : '0' + rawSeconds;
            const minutes = (drain - seconds)/60

            return minutes + ":" + seconds;
        },
    }
};
</script>