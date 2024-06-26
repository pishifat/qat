<template>
    <td>
        <!-- impact -->
        <span
            v-if="hasData"
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
        hasData() {
            return this.event.impactNum !== undefined;
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
        selectEvent () {
            this.$store.commit('dataCollection/setSelectedEventId', this.event.id);
        },
    },
};
</script>