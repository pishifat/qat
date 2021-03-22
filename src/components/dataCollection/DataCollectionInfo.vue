<template>
    <modal-dialog
        id="editReason"
        :title="title"
    >
        <div v-if="selectedEvent" class="container">
            <p>
                <b>Mapset:</b>
                <a
                    :href="selectedEvent.discussionId ?
                        'https://osu.ppy.sh/beatmapsets/' + selectedEvent.beatmapsetId + '/discussion/-/generalAll#/' + selectedEvent.discussionId :
                        'https://osu.ppy.sh/beatmapsets/' + selectedEvent.beatmapsetId + '/discussion/-/events'"
                    target="_blank"
                >
                    {{ selectedEvent.artistTitle }}
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
                :type="selectedEvent.type"
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
        /** @returns {string} */
        title () {
            if (!this.selectedEvent) return '';

            return `Edit ${this.selectedEvent.type == 'disqualify' ? 'disqualification' : 'nomination reset'}`;
        },
    },
    watch: {
        selectedEvent() {
            this.newEventContent = this.selectedEvent.content;
        },
    },
    methods: {
        async updateContent(e) {
            const data = await this.executePost('/dataCollection/updateContent/' + this.selectedEvent.id, { reason: this.newEventContent }, e);

            if (data && !data.error) {
                this.$store.commit('dataCollection/updateEvent', {
                    id: this.selectedEvent.id,
                    type: this.selectedEvent.type,
                    modifiedField: 'content',
                    value: data.reason,
                });
            }
        },
    },
};
</script>