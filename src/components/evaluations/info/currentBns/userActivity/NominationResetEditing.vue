<template>
    <td>
        <template v-if="!editing">
            <!-- SEV/impact -->
            <span v-if="loggedInUser && loggedInUser.isNatOrTrialNat">
                <span
                    v-if="hasSEV"
                    :class="calculateSEVColor"
                    data-bs-toggle="tooltip"
                    :title="getSeverityTooltip(event.obviousness, event.severity)"
                >
                    ({{ event.obviousness }}/{{ event.severity }})
                </span>
                <span
                    v-else-if="hasImpact"
                    :class="getImpact(event.impactNum).color"
                    data-bs-toggle="tooltip"
                    :title="getImpact(event.impactNum).text"
                >
                    <i v-if="event.impactNum !== 0" :class="getImpact(event.impactNum).icon" />
                    <font-awesome-icon v-else :icon="getImpact(event.impactNum).icon" />
                </span>
            </span>
            <span v-if="loggedInUser && loggedInUser.isNat">
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
                v-if="loggedInUser && loggedInUser.isNat && hasData"
                :class="getImpact(event.impactNum).color"
                data-bs-toggle="tooltip"
                :title="getImpact(event.impactNum).text"
            >
                <i v-if="event.impactNum !== 0" :class="getImpact(event.impactNum).icon" />
                <font-awesome-icon v-else :icon="getImpact(event.impactNum).icon" />
            </span>
            <a href="#" @click.prevent="editing = !editing">
                <i class="fas fa-edit" />
            </a>
            <p class="mt-2 mb-1">
                Shorten the "reason" field:
            </p>
            <textarea
                v-model="newEventContent"
                class="form-control form-control-sm me-2"
                type="text"
                rows="4"
                maxlength="1000"
            />
            <button class="btn btn-sm btn-primary w-100 mb-2" @click="updateContent($event);">
                Save
            </button>

            <hr>

            <obviousness-severity
                :obviousness="event.obviousness"
                :severity="event.severity"
                :event-id="event._id"
                :type="event.type"
                :is-nomination-reset-editing="true"
            />
            <impact
                v-if="hasImpact"
                :impact="event.impactNum"
                :event-id="event._id"
                :type="event.type"
            />
        </template>
    </td>
</template>

<script>
import { mapState } from 'vuex';
import Impact from '../Impact.vue';
import ObviousnessSeverity from '../ObviousnessSeverity.vue';

export default {
    name: 'NominationResetEditing',
    components: {
        Impact,
        ObviousnessSeverity,
    },
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
        hasSEV() {
            return (this.event.obviousness || this.event.obviousness == 0) && (this.event.severity || this.event.severity == 0);
        },
        /** @returns {boolean} */
        hasImpact() {
            return this.event.impactNum !== undefined;
        },
        /** @returns {string} */
        calculateSEVColor() {
            let total = this.event.obviousness + this.event.severity;
            if (total >= 4 || this.event.obviousness == 2 || this.event.severity == 3) return 'text-danger';
            else if (total >= 2) return 'text-neutral';
            else return 'text-success';
        },
    },
    watch: {
        editing () {
            this.newEventContent = this.event.content;
        },
    },
    methods: {
        getImpact(impact) {
            switch (impact) {
                case 2:
                    return { color: 'text-danger', icon: 'fas fa-times-circle', text: 'Severe' };
                case 1:
                    return { color: 'text-warning', icon: 'fas fa-exclamation-circle', text: 'Notable' };
                case 0:
                    return { color: 'text-success', icon: 'fa-solid fa-circle-check', text: 'Minor' };
                default:
                    return;
            }
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
        async updateContent (e) {
            const data = await this.$http.executePost('/dataCollection/updateContent/' + this.event._id, { reason: this.newEventContent }, e);
            this.$store.commit('dataCollection/updateEvent', {
                id: this.event._id,
                type: this.event.type,
                modifiedField: 'content',
                value: data.reason,
            });
        },
    },
};
</script>
