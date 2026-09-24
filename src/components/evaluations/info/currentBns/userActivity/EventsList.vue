<template>
    <div>
        <div class="ms-2">
            <a
                :href="events && `#${eventsId}`"
                data-bs-toggle="collapse"
            >{{ header }} <i class="fas fa-angle-down" /></a>
            ({{ isLoading ? '...' : events ? events.length : '0' }})
        </div>
        <div v-if="events" :id="eventsId" class="collapse">
            <data-table
                v-if="events.length"
                :headers="['Date', 'Mapset', 'Host']"
            >
                <tr
                    v-for="event in events"
                    :key="event.id"
                    :class="{ 'events-list-reviewed': canMarkReviewed && event.isReviewed }"
                >
                    <td class="text-nowrap">
                        {{ toMonthDayYear(timestamp(event)) }}
                    </td>
                    <td>
                        <a
                            :href="'osu://dl/' + beatmapsetId(event)"
                            data-bs-toggle="tooltip"
                            data-bs-placement="right"
                            title="osu!direct download"
                        >
                            <i class="fas fa-file-download" />
                        </a>
                        <a
                            :href="
                                'https://osu.ppy.sh/beatmapsets/' +
                                    beatmapsetId(event) +
                                    '/discussion/-/generalAll/total?user=' +
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
                            data-bs-toggle="tooltip"
                            data-bs-placement="right"
                            title="total drain time"
                        >
                            ({{ totalDrain(event.beatmaps) }})
                        </span>
                        <i
                            v-if="trackId(event)"
                            class="fas fa-microphone text-info ms-1"
                            data-bs-toggle="tooltip"
                            data-bs-placement="right"
                            title="Featured Artist"
                        />
                        <span
                            v-if="discussionTotal(event) != null"
                            class="discussion-counts badge rounded-pill ms-1"
                            :class="discussionBadgeClass(discussionTotal(event))"
                            tabindex="0"
                        >
                            <i class="fas fa-comments" />
                            {{ discussionTotal(event) }}
                            <span class="discussion-counts-card">
                                <span
                                    v-for="row in discussionBreakdown(event)"
                                    :key="row.key"
                                    class="discussion-counts-row"
                                    :class="{ 'is-zero': !row.count }"
                                >
                                    <span class="discussion-counts-type">
                                        <i
                                            v-if="row.icon"
                                            :class="['discussion-counts-icon', row.icon, 'is-' + row.key]"
                                        />
                                        <span>{{ row.label }}</span>
                                    </span>
                                    <span>{{ row.count }}</span>
                                </span>
                            </span>
                        </span>
                        <a
                            v-if="canMarkReviewed"
                            href="#"
                            data-bs-toggle="tooltip"
                            data-bs-placement="right"
                            title="mark map as reviewed"
                            @click.prevent="toggleIsReviewed(event)"
                        >
                            <span
                                v-if="processingId == event._id"
                                class="spinner-border spinner-border-sm review-spinner"
                                role="status"
                            />
                            <font-awesome-icon
                                v-else
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
            <p v-else class="small ms-4">
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
        isEvaluation: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            processingId: null,
            discussionCountKeys: ['suggestion', 'problem', 'mapper_note', 'praise', 'hype', 'review'],
            discussionCountLabels: {
                suggestion: 'Suggestion',
                problem: 'Problem',
                mapper_note: 'Note',
                praise: 'Praise',
                hype: 'Hype',
                review: 'Review',
            },
            discussionCountIcons: {
                suggestion: 'far fa-circle',
                problem: 'fas fa-exclamation-circle',
                mapper_note: 'fas fa-sticky-note',
                praise: 'fas fa-heart',
                hype: 'fas fa-bullhorn',
                review: 'fas fa-search',
            },
        };
    },
    computed: {
        ...mapState('activity', ['isLoading']),
        ...mapState(['loggedInUser']),
        canMarkReviewed() {
            return this.loggedInUser && (this.loggedInUser.isNat || this.loggedInUser.isTrialNat) && this.isEvaluation;
        },
    },
    methods: {
        async toggleIsReviewed(event) {
            if (this.processingId) return;

            this.processingId = event._id;
            const data = await this.$http.executePost(
                '/dataCollection/toggleIsReviewed/' + event._id,
                {}
            );

            if (this.$http.isValid(data)) {
                this.$store.commit('activity/updateEvent', {
                    id: event._id,
                    type: event.type,
                    modifiedField: 'isReviewed',
                    value: data.isReviewed,
                });
            }
            this.processingId = null;
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
        trackId(event) {
            if (this.eventsId == 'qualityAssuranceChecks') {
                return event.event.trackId;
            } else {
                return event.trackId;
            }
        },
        userDiscussionsCounts(event) {
            const source = this.eventsId == 'qualityAssuranceChecks' ? event.event : event;

            return source.userDiscussionsCounts || source.userDiscussionsCount;
        },
        discussionTotal(event) {
            const counts = this.userDiscussionsCounts(event);

            if (counts == null) return null;
            if (typeof counts === 'number') return counts;

            return this.discussionCountKeys.reduce((sum, key) => sum + (counts[key] || 0), 0);
        },
        discussionBreakdown(event) {
            const counts = this.userDiscussionsCounts(event);

            if (counts == null || typeof counts === 'number') {
                return [{ key: 'total', label: 'Posts', count: counts || 0 }];
            }

            return this.discussionCountKeys.map(key => ({
                key,
                label: this.discussionCountLabels[key],
                icon: this.discussionCountIcons[key],
                count: counts[key] || 0,
            }));
        },
        discussionBadgeClass(count) {
            if (count < 5) return 'text-bg-danger';
            if (count <= 10) return 'text-bg-warning';

            return 'text-bg-success';
        },
        totalDrain(beatmaps) {
            let drain = 0;

            for (const beatmap of beatmaps) {
                drain += beatmap.drain;
            }

            const rawSeconds = drain % 60;
            const seconds = rawSeconds > 9 ? rawSeconds : '0' + rawSeconds;
            const minutes = (drain - seconds)/60;

            return minutes + ':' + seconds;
        },
    },
};
</script>

<style>
.events-list-reviewed {
    --bs-table-bg: color-mix(in srgb, var(--bs-success) 16%, #212529);
}

.review-spinner {
    width: 0.9rem;
    height: 0.9rem;
    vertical-align: -0.125em;
}

.discussion-counts {
    position: relative;
    cursor: default;
}

.discussion-counts-card {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 0.4rem;
    z-index: 20;
    min-width: 9.5rem;
    padding: 0.4rem 0.55rem;
    background: hsl(170, 20%, 15%);
    border: 1px solid hsl(170, 20%, 25%);
    border-radius: 0.35rem;
    box-shadow: 0 0.25rem 0.6rem rgba(0, 0, 0, 0.4);
    color: #f8f9fa;
    font-weight: normal;
    text-align: left;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 120ms ease-out, visibility 0s linear 120ms;
}

.discussion-counts:hover .discussion-counts-card,
.discussion-counts:focus-within .discussion-counts-card {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity 160ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s;
}

.discussion-counts-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    font-size: 0.8rem;
    line-height: 1.4;
}

.discussion-counts-row.is-zero {
    opacity: 0.4;
}

.discussion-counts-type {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.discussion-counts-icon {
    width: 0.85rem;
    text-align: center;
}

.discussion-counts-icon.is-suggestion { color: #f2c94c; }
.discussion-counts-icon.is-problem { color: #e74c3c; }
.discussion-counts-icon.is-mapper_note { color: #9b7ed9; }
.discussion-counts-icon.is-praise { color: #4aa3df; }
.discussion-counts-icon.is-hype { color: #4aa3df; }
.discussion-counts-icon.is-review { color: #6ebf65; }
</style>