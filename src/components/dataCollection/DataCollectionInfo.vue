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
                class="form-control form-control-sm me-2"
                type="text"
                rows="4"
                maxlength="1000"
            />

            <button class="btn btn-sm w-100 btn-primary mb-2" @click="updateContent($event)">
                Save
            </button>

            <hr>

            <obviousness-severity
                :obviousness="selectedEvent.obviousness"
                :severity="selectedEvent.severity"
                :event-id="selectedEvent._id"
                :type="selectedEvent.type"
            />
            <impact
                :impact="selectedEvent.impactNum"
                :event-id="selectedEvent._id"
                :type="selectedEvent.type"
            />
        </div>
    </modal-dialog>
</template>

<script>
import { mapGetters } from 'vuex';
import Impact from '../evaluations/info/currentBns/Impact.vue';
import ObviousnessSeverity from '../evaluations/info/currentBns/ObviousnessSeverity.vue';
import ModalDialog from '../ModalDialog.vue';

export default {
    name: 'DataCollectionInfo',
    components: {
        Impact,
        ObviousnessSeverity,
        ModalDialog,
    },
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
            const data = await this.$http.executePost('/dataCollection/updateContent/' + this.selectedEvent.id, { reason: this.newEventContent }, e);

            if (this.$http.isValid(data)) {
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