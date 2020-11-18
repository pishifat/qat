<template>
    <td>
        <template v-if="!editing">
            <span
                v-if="hasData"
                :class="calculateColor"
                data-toggle="tooltip"
                :title="getSeverityTooltip(event.obviousness, event.severity)"
            >
                ({{ event.obviousness }}/{{ event.severity }})
            </span>
            <span v-if="loggedInUser.isNat">
                <a href="#" @click.prevent="editing = !editing">
                    <i class="fas fa-edit" />
                </a>
            </span>
            <span v-html="$md.renderInline(event.content)" />

            <div v-if="event.qaComment" class="mt-2">
                <b>QA comment:</b>
                <span v-html="$md.render(event.qaComment)" />
            </div>
        </template>

        <template v-else>
            <span
                v-if="hasData"
                :class="calculateColor"
                data-toggle="tooltip"
                :title="getSeverityTooltip(event.obviousness, event.severity)"
            >
                ({{ event.obviousness }}/{{ event.severity }})
            </span>
            <a href="#" @click.prevent="editing = !editing">
                <i class="fas fa-edit" />
            </a>
            <p class="mt-2 mb-1">
                Shorten the "reason" field:
            </p>
            <textarea
                v-model="newEventContent"
                class="form-control form-control-sm mr-2"
                type="text"
                rows="4"
                maxlength="1000"
            />
            <button class="btn btn-sm btn-primary btn-block mb-2" @click="updateContent($event);">
                Save
            </button>

            <obviousness-severity
                :obviousness="event.obviousness"
                :severity="event.severity"
                :event-id="event._id"
                :type="event.type"
            />
        </template>
    </td>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../../../../../mixins/postData.js';
import ObviousnessSeverity from '../ObviousnessSeverity.vue';

export default {
    name: 'NominationResetEditing',
    components: {
        ObviousnessSeverity,
    },
    mixins: [ postData ],
    props: {
        event: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            editing: false,
            newEventContent: null,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        /** @returns {boolean} */
        hasData () {
            if ((this.event.obviousness || this.event.obviousness == 0) && (this.event.severity || this.event.severity == 0)) {
                return true;
            } else {
                return false;
            }
        },
        /** @returns {string} */
        calculateColor () {
            let total = this.event.obviousness + this.event.severity;
            if (total >= 4 || this.event.obviousness == 2 || this.event.severity == 3) return 'text-success';
            else if (total >= 2) return 'text-neutral';
            else return 'text-danger';
        },
    },
    watch: {
        editing () {
            this.newEventContent = this.event.content;
        },
    },
    methods: {
        async updateContent (e) {
            const result = await this.executePost('/dataCollection/updateContent/' + this.event._id, { reason: this.newEventContent }, e);
            this.$store.commit('dataCollection/updateEvent', {
                id: this.event._id,
                type: this.event.type,
                modifiedField: 'content',
                value: result,
            });
            this.$store.dispatch('updateToastMessages', {
                message: `Updated content`,
                type: 'success',
            });
        },
        getSeverityTooltip (obviousness, severity) {
            let tooltip = '';

            switch (obviousness) {
                case 0:
                    tooltip += 'Not obvious';
                    break;
                case 1:
                    tooltip += 'Can be found with experience';
                    break;
                case 2:
                    tooltip += 'Can be found at a glance';
                    break;
            }

            switch (severity) {
                case 0:
                    tooltip += ' / Not severe';
                    break;
                case 1:
                    tooltip += ' / Slightly detrimental to gameplay';
                    break;
                case 2:
                    tooltip += ' / Noticably detrimental to gameplay';
                    break;
                case 3:
                    tooltip += ' / More or less unplayable';
                    break;
            }

            return tooltip;
        },
    },
};
</script>
