<template>
    <td>
        <!-- SEV/impact -->
        <span
            v-if="hasSEV"
            :class="calculateSEVColor"
            data-toggle="tooltip"
            :title="getSeverityTooltip(event.obviousness, event.severity)"
        >
            ({{ event.obviousness }}/{{ event.severity }})
        </span>
        <span
            v-else-if="hasImpact"
            :class="getImpact(event.impactNum).color"
            data-toggle="tooltip"
            :title="getImpact(event.impactNum).text"
        >
            <i v-if="event.impactNum !== 0" :class="getImpact(event.impactNum).icon" />
            <font-awesome-icon v-else :icon="getImpact(event.impactNum).icon" />
        </span>

        <!-- edit button -->
        <a
            href="#"
            data-toggle="modal"
            data-target="#editReason"
            :data-entry="event.id"
            @click="selectEvent()"
        >
            <i class="fas fa-edit" />
        </a>

        <!-- dq reason -->
        <span v-if="event.content" v-html="$md.render(event.content)" />
        <i v-else class="text-danger">No reason provided.</i>
    </td>
</template>

<script>
export default {
    name: 'ReasonRow',
    props: {
        event: {
            type: Object,
            required: true,
        },
    },
    computed: {
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
        selectEvent () {
            this.$store.commit('dataCollection/setSelectedEventId', this.event.id);
        },
    },
};
</script>