<template>
    <div id="editReason" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div v-if="selectedEvent" class="modal-content custom-bg-dark">
                <div class="modal-header text-dark bg-nat-logo">
                    <h5 class="modal-title">
                        Edit {{ selectedEvent.eventType == 'Disqualified' ? 'disqualification' : 'nomination reset' }}
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="container text-shadow">
                        <p>
                            Mapset:
                            <a
                                :href="selectedEvent.postId ?
                                    'https://osu.ppy.sh/beatmapsets/' + selectedEvent.beatmapsetId + '/discussion/-/generalAll#/' + selectedEvent.postId :
                                    'https://osu.ppy.sh/beatmapsets/' + selectedEvent.beatmapsetId + '/discussion/-/events'"
                                target="_blank"
                            >
                                {{ selectedEvent.metadata }}
                            </a>
                        </p>
                        <div class="d-flex">
                            <textarea
                                v-model="newEventContent"
                                class="form-control form-control-sm dark-textarea mr-2"
                                type="text"
                                rows="4"
                                maxlength="1000"
                            />
                            <button class="btn btn-xs btn-nat align-self-center" @click="updateContent($event);">
                                Save
                            </button>
                        </div>
                        <obviousness-severity
                            class="small"
                            :obviousness="selectedEvent.obviousness"
                            :severity="selectedEvent.severity"
                            :event-id="selectedEvent._id"
                            :event-type="selectedEvent.eventType"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../mixins/postData.js';
import ObviousnessSeverity from '../evaluations/currentBnEvaluations/currentBnInfo/ObviousnessSeverity.vue';

export default {
    name: 'DataCollectionInfo',
    components: {
        ObviousnessSeverity,
    },
    mixins: [postData],
    data() {
        return {
            newEventContent: null,
        };
    },
    computed: {
        ...mapGetters([
            'selectedEvent',
        ]),
    },
    watch: {
        selectedEvent() {
            this.newEventContent = this.selectedEvent.content;
        },
    },
    methods: {
        async updateContent(e) {
            const result = await this.executePost('/dataCollection/updateContent/' + this.selectedEvent.id, { reason: this.newEventContent }, e);
            this.$store.commit('updateEvent', {
                id: this.selectedEvent.id,
                type: this.selectedEvent.eventType,
                modifiedField: 'content',
                value: result,
            });
            this.$store.dispatch('updateToastMessages', {
                message: `updated content`,
                type: 'info',
            });
        },
    },
};
</script>