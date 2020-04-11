<template>
    <div id="editReason" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div v-if="selectedEntry" class="modal-content custom-bg-dark">
                <div class="modal-header text-dark bg-nat-logo">
                    <h5 class="modal-title">
                        Edit DQ/Reset
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="container text-shadow">
                        <p>
                            Mapset:
                            <a :href="selectedEntry.postId ? 'https://osu.ppy.sh/beatmapsets/' + selectedEntry.beatmapsetId + '/discussion/-/generalAll#/' + selectedEntry.postId : 'https://osu.ppy.sh/beatmapsets/' + selectedEntry.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ selectedEntry.metadata }}
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
                            :obviousness="selectedEntry.obviousness"
                            :severity="selectedEntry.severity"
                            :event-id="selectedEntry._id"
                            :event-type="selectedEntry.eventType"
                            @update-obviousness="$emit('update-obviousness', $event);"
                            @update-severity="$emit('update-severity', $event);"
                        />
                    </div>
                    <p id="errors" class="errors">
                        {{ info }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';
import ObviousnessSeverity from '../evaluations/currentBnEvaluations/currentBnInfo/ObviousnessSeverity.vue';

export default {
    name: 'DataCollectionInfo',
    components: {
        ObviousnessSeverity,
    },
    mixins: [postData, filterLinks],
    props: {
        selectedEntry: Object,
    },
    data() {
        return {
            reasonInput: '',
            confirm: '',
            info: '',
            tempId: null,
            newEventContent: null,
        };
    },
    watch: {
        selectedEntry() {
            this.newEventContent = this.selectedEntry.content;
        },
    },
    methods: {
        async updateContent(e) {
            const result = await this.executePost('/dataCollection/updateContent/' + this.selectedEntry.id, { reason: this.newEventContent }, e);
            this.$emit('update-content', { id: this.selectedEntry._id, type: this.selectedEntry.eventType, value: result });
        },
    },
};
</script>