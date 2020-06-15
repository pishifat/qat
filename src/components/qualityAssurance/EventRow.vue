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
                            :metadata="event.metadata"
                            :beatmapset-id="event.beatmapsetId"
                        />
                    </div>

                    <div class="col-sm-12 col-md-7 mt-2">
                        <div class="row">
                            <beatmap-host
                                class="col-sm-3 ml-2 ml-sm-0"
                                :host-id="event.hostId"
                                :host-name="event.hostName"
                            />

                            <due-date
                                class="col-sm-3 ml-2 ml-sm-0"
                                :timestamp="event.timestamp"
                            />

                            <quality-assurance-checkers
                                class="col-sm-4 ml-2 ml-sm-0"
                                :quality-assurance-checkers="event.qualityAssuranceCheckers"
                                :is-quality-assurance-checker="isQualityAssuranceChecker"
                                :show-all="showAll"
                            />

                            <assignment-buttons
                                v-if="!isOutdated && !loggedInUser.isUser"
                                class="col-sm-2 ml-2 ml-sm-0 text-center"
                                :event-id="event.id"
                                :is-quality-assurance-checker="isQualityAssuranceChecker"
                                :is-max-checks="isMaxChecks"
                            />
                        </div>
                    </div>
                </div>

                <comments
                    v-if="!loggedInUser.isUser || (loggedInUser.isUser && event.qualityAssuranceComments.length)"
                    class="row small"
                    :class="loggedInUser.isUser ? 'mt-2' : ''"
                    :quality-assurance-comments="event.qualityAssuranceComments"
                    :event-id="event.id"
                    :is-max-checks="isMaxChecks"
                    :is-outdated="isOutdated"
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
            this.event.qualityAssuranceCheckers.forEach(user => {
                if (user.id == this.loggedInUser.id) {
                    valid = true;
                }
            });

            return valid;
        },
        showAll() {
            if (this.event.qualityAssuranceCheckers && (this.loggedInUser.isNat || this.isMaxChecks || this.isOutdated)) return true;
            else return false;
        },
    },
};
</script>

<style scoped>

.low-opacity {
    opacity: 0.5 !important;
}

</style>

