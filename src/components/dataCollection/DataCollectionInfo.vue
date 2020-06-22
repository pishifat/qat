<template>
    <modal-dialog
        id="editReason"
        :title="title"
    >
        <div v-if="selectedEvent" class="container">
            <p>
                <b>Mapset:</b>
                <a
                    :href="selectedEvent.postId ?
                        'https://osu.ppy.sh/beatmapsets/' + selectedEvent.beatmapsetId + '/discussion/-/generalAll#/' + selectedEvent.postId :
                        'https://osu.ppy.sh/beatmapsets/' + selectedEvent.beatmapsetId + '/discussion/-/events'"
                    target="_blank"
                >
                    {{ selectedEvent.metadata }}
                </a>
            </p>

            <textarea
                v-model="newEventContent"
                class="form-control form-control-sm mr-2"
                type="text"
                rows="4"
                maxlength="1000"
            />

            <button class="btn btn-sm btn-block btn-primary mb-2" @click="updateContent($event)">
                Save
            </button>

            <obviousness-severity
                :obviousness="selectedEvent.obviousness"
                :severity="selectedEvent.severity"
                :event-id="selectedEvent._id"
                :event-type="selectedEvent.eventType"
            />
        </div>
    </modal-dialog>
</template>

<script>
import { mapGetters } from 'vuex';
import postData from '../../mixins/postData.js';
import ObviousnessSeverity from '../evaluations/info/currentBns/ObviousnessSeverity.vue';
import ModalDialog from '../ModalDialog.vue';

export default {
    name: 'DataCollectionInfo',
    components: {
        ObviousnessSeverity,
        ModalDialog,
    },
    mixins: [postData],
    data() {
        return {
            newEventContent: null,
        };
    },
    computed: {
        ...mapGetters('dataCollection', [
            'selectedEvent',
        ]),
        title () {
            if (!this.selectedEvent) return '';

            return `Edit ${this.selectedEvent.eventType == 'Disqualified' ? 'disqualification' : 'nomination reset'}`;
        },
    },
    watch: {
        selectedEvent() {
            this.newEventContent = this.selectedEvent.content;
        },
    },
    methods: {
        async updateContent(e) {
            const result = await this.executePost('/dataCollection/updateContent/' + this.selectedEvent.id, { reason: this.newEventContent }, e);
            this.$store.commit('dataCollection/updateEvent', {
                id: this.selectedEvent.id,
                type: this.selectedEvent.eventType,
                modifiedField: 'content',
                value: result,
            });
            this.$store.dispatch('updateToastMessages', {
                message: `Updated content`,
                type: 'success',
            });
        },
    },
};
</script>