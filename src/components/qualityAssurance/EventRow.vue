<template>
    <div class="row">
        <div class="col-sm-12">
            <div
                class="card static-card text-shadow"
                :class="isMaxChecks || isOutdated || isQualityAssuranceChecker ? 'low-opacity' : ''"
            >
                <div class="card-header row px-0 py-0">
                    <div class="col-sm-5 row">
                        <beatmap-thumbnail
                            class="col-lg-2 col-md-3 col-sm-4"
                            :beatmapset-id="event.beatmapsetId"
                        />
                        <beatmap-metadata
                            class="row col-lg-10 col-md-9 col-sm-8"
                            :metadata="event.metadata"
                            :beatmapset-id="event.beatmapsetId"
                        />
                    </div>
                    <div class="col-sm-7 pr-2">
                        <div class="row">
                            <beatmap-host
                                class="row col-sm-3"
                                :host-id="event.hostId"
                                :host-name="event.hostName"
                            />
                            <due-date
                                class="row col-sm-3"
                                :timestamp="event.timestamp"
                            />
                            <quality-assurance-checkers
                                class="col-sm-4"
                                :user-osu-id="userOsuId"
                                :username="username"
                                :quality-assurance-checkers="event.qualityAssuranceCheckers"
                                :show-all="showAll"
                                :is-quality-assurance-checker="isQualityAssuranceChecker"
                            />
                            <assignment-buttons
                                v-if="!isOutdated"
                                class="col-sm-3"
                                :event-id="event.id"
                                :is-quality-assurance-checker="isQualityAssuranceChecker"
                                :is-max-checks="isMaxChecks"
                                @update-quality-assurance-checkers="$emit('update-quality-assurance-checkers', $event)"
                            />
                        </div>
                    </div>
                </div>
                <notes
                    class="row col-sm-12 small text-shadow my-2"
                    :quality-assurance-comments="event.qualityAssuranceComments"
                    :user-id="userId"
                />
            </div>
        </div>
    </div>
</template>

<script>
import BeatmapThumbnail from './BeatmapThumbnail.vue';
import BeatmapMetadata from './BeatmapMetadata.vue';
import BeatmapHost from './BeatmapHost.vue';
import DueDate from './DueDate.vue';
import QualityAssuranceCheckers from './QualityAssuranceCheckers.vue';
import AssignmentButtons from './AssignmentButtons.vue';
import Notes from './Notes.vue';

export default {
    name: 'EventRow',
    components: {
        BeatmapThumbnail,
        BeatmapMetadata,
        BeatmapHost,
        DueDate,
        QualityAssuranceCheckers,
        AssignmentButtons,
        Notes,
    },
    props: {
        event: {
            type: Object,
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        userOsuId: {
            type: Number,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        isNat: Boolean,
        isOutdated: Boolean,
        isMaxChecks: Boolean,
    },
    computed: {
        isQualityAssuranceChecker() {
            let valid;
            this.event.qualityAssuranceCheckers.forEach(user => {
                if (user.id == this.userId) {
                    valid = true;
                }
            });

            return valid;
        },
        showAll() {
            if (this.event.qualityAssuranceCheckers && (this.isNat || this.isMaxChecks || this.isOutdated)) return true;
            else return false;
        },
    },
};
</script>

<style>
    .card:hover {
        transform: scale(1) !important;
        opacity: 1;
    }

    .card {
        min-height: 0px !important;
    }

    .bg-darker {
        background-color: #252525a6 !important;
    }

    .collapsing {
        -webkit-transition: none;
        transition: none;
        display: none;
    }

    .low-opacity {
        opacity: 0.5 !important;
    }
</style>

