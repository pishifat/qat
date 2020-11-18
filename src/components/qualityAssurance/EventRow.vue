<template>
    <div class="row my-2">
        <div class="col-sm-12">
            <div
                class="card"
                :class="isMaxChecks || isOutdated || isQualityAssuranceChecker ? 'low-opacity' : ''"
            >
                <div class="row">
                    <div class="col-sm-12 col-md-5 d-flex">
                        <beatmap-thumbnail
                            :beatmapset-id="event.beatmapsetId"
                        />

                        <beatmap-metadata
                            class="mt-2 ml-2"
                            :artist-title="event.artistTitle"
                            :beatmapset-id="event.beatmapsetId"
                        />
                    </div>

                    <div class="col-sm-12 col-md-7 mt-2">
                        <div class="row">
                            <beatmap-host
                                class="col-sm-3 ml-2 ml-sm-0"
                                :creator-id="event.creatorId"
                                :creator-name="event.creatorName"
                            />

                            <due-date
                                class="col-sm-3 ml-2 ml-sm-0"
                                :timestamp="event.timestamp"
                            />

                            <quality-assurance-checkers
                                class="col-sm-4 ml-2 ml-sm-0"
                                :quality-assurance-checks="event.qualityAssuranceChecks"
                                :is-quality-assurance-checker="isQualityAssuranceChecker"
                                :show-all="showAll"
                            />

                            <assignment-buttons
                                v-if="!isOutdated && loggedInUser.hasBasicAccess"
                                class="col-sm-2 ml-2 ml-sm-0 text-center"
                                :event-id="event.id"
                                :is-quality-assurance-checker="isQualityAssuranceChecker"
                                :is-max-checks="isMaxChecks"
                            />
                        </div>
                    </div>
                </div>

                <comments
                    v-if="isQualityAssuranceChecker || hasComments"
                    class="row small"
                    :class="loggedInUser.hasBasicAccess ? 'mt-2' : ''"
                    :quality-assurance-checks="event.qualityAssuranceChecks"
                    :event-id="event.id"
                    :is-quality-assurance-checker="isQualityAssuranceChecker"
                    :disable="isMaxChecks || isOutdated"
                />
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import BeatmapThumbnail from './BeatmapThumbnail.vue';
import BeatmapMetadata from './BeatmapMetadata.vue';
import BeatmapHost from './BeatmapHost.vue';
import DueDate from './DueDate.vue';
import QualityAssuranceCheckers from './QualityAssuranceCheckers.vue';
import AssignmentButtons from './AssignmentButtons.vue';
import Comments from './Comments.vue';

export default {
    name: 'EventRow',
    components: {
        BeatmapThumbnail,
        BeatmapMetadata,
        BeatmapHost,
        DueDate,
        QualityAssuranceCheckers,
        AssignmentButtons,
        Comments,
    },
    props: {
        event: {
            type: Object,
            required: true,
        },
        isMaxChecks: Boolean,
        isOutdated: Boolean,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        isQualityAssuranceChecker() {
            let valid;

            for (const check of this.event.qualityAssuranceChecks) {
                if (check.user.id == this.loggedInUser.id) {
                    valid = true;
                    break;
                }
            }

            return valid;
        },
        showAll() {
            if (this.event.qualityAssuranceChecks && (this.loggedInUser.isNat || this.isMaxChecks || this.isOutdated)) return true;
            else return false;
        },
        hasComments() {
            return this.event.qualityAssuranceChecks.some(q => q.comment && q.comment.length);
        },
    },
};
</script>

<style scoped>

.low-opacity {
    opacity: 0.5 !important;
}

</style>

