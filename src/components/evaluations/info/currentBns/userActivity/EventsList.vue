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
                :headers="['Date', 'Mapset', 'Host']"
            >
                <tr v-for="event in events" :key="event.id">
                    <td class="text-nowrap">
                        {{ timestamp(event) | toMonthDayYear }}
                    </td>
                    <td>
                        <a 
                            :href="'osu://dl/' + beatmapsetId(event)"
                            data-toggle="tooltip"
                            data-placement="right"
                            title="osu!direct download"
                        >
                            <i class="fas fa-file-download mr-1" />
                        </a>
                        <a
                            :href="
                                'https://osu.ppy.sh/beatmapsets/' +
                                beatmapsetId(event) +
                                '/discussion?user=' +
                                osuId
                            "
                            target="_blank"
                        >
                            <mode-display :modes="modes(event)" />

                            {{ artistTitle(event) }}
                        </a>
                        <span
                            v-if="event.beatmaps && event.beatmaps.length"
                            class="text-secondary small"
                            data-toggle="tooltip"
                            data-placement="right"
                            title="total drain time"
                        >
                            ({{ totalDrain(event.beatmaps)}})
                        </span>
                        <a
                            v-if="loggedInUser && (loggedInUser.isNat || loggedInUser.isTrialNat) && isEvaluation"
                            href="#"
                            :class="processing ? 'processing' : ''"
                            data-toggle="tooltip"
                            data-placement="right"
                            title="mark map as reviewed"
                            @click.prevent="toggleIsReviewed(event)"
                        >
                            <font-awesome-icon
                                icon="fa-solid fa-circle-check"
                                :class="
                                    event.isReviewed
                                        ? 'text-success'
                                        : 'text-secondary'
                                "
                            />
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
            <p v-else class="small ml-4">None...</p>
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
        isEvaluation: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            processing: false,
        };
    },
    computed: {
        ...mapState('activity', ['isLoading']),
        ...mapState(['loggedInUser']),
    },
    methods: {
        async toggleIsReviewed(event) {
            if (!this.processing) {
                this.processing = true;
                const data = await this.$http.executePost(
                    '/dataCollection/toggleIsReviewed/' + event._id,
                    {}
                );
                this.$store.commit('dataCollection/updateEvent', {
                    id: event._id,
                    type: event.type,
                    modifiedField: 'isReviewed',
                    value: data.isReviewed,
                });
                this.processing = false;
            }
        },
        beatmapsetId(event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.beatmapsetId;
            } else {
                return event.beatmapsetId;
            }
        },
        modes(event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.modes;
            } else {
                return event.modes;
            }
        },
        artistTitle(event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.artistTitle;
            } else {
                return event.artistTitle;
            }
        },
        creatorName(event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.creatorName;
            } else {
                return event.creatorName;
            }
        },
        creatorId(event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.creatorId;
            } else {
                return event.creatorId;
            }
        },
        timestamp(event) {
            return event.timestamp;
        },
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
    },
};
</script>

<style>
.processing {
    pointer-events: none;
}
</style>