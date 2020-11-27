<template>
    <div>
        <p class="ml-2">
            <a :href="events && `#${eventsId}`" data-toggle="collapse">{{ header }} <i class="fas fa-angle-down" /></a>
            ({{ isLoading ? '...' : events ? events.length : '0' }})
        </p>
        <div v-if="events" :id="eventsId" class="collapse">
            <data-table
                v-if="events.length"
                :headers="['Date', 'Mapset', 'Host']"
            >
                <tr v-for="event in events" :key="event.id">
                    <td class="text-nowrap">
                        {{ event.timestamp | toMonthDay }}
                    </td>
                    <td>
                        <a :href="'https://osu.ppy.sh/beatmapsets/' + beatmapsetId(event) + '/discussion?user=' + osuId" target="_blank">
                            <mode-display
                                :modes="modes(event)"
                            />

                            {{ artistTitle(event) }}
                        </a>
                    </td>
                    <td>
                        <user-link
                            :username="creatorName(event)"
                            :osu-id="creatorId(event)"
                        />
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
import UserLink from '../../../../UserLink.vue';

export default {
    name: 'EventsList',
    components: {
        DataTable,
        ModeDisplay,
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
        osuId: {
            type: Number,
            required: true,
        },
    },
    computed: {
        ...mapState('activity', [
            'isLoading',
        ]),
    },
    methods: {
        beatmapsetId (event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.beatmapsetId;
            } else {
                return event.beatmapsetId;
            }
        },
        modes (event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.modes;
            } else {
                return event.modes;
            }
        },
        artistTitle (event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.artistTitle;
            } else {
                return event.artistTitle;
            }
        },
        creatorName (event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.creatorName;
            } else {
                return event.creatorName;
            }
        },
        creatorId (event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.creatorId;
            } else {
                return event.creatorId;
            }
        },
    },
};
</script>