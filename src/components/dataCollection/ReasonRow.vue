<template>
    <td>
        <!-- impact -->
        <span
            v-if="hasData"
            :class="event.impact ? 'text-warning' : 'text-success'"
            data-toggle="tooltip"
            :title="event.impact ? 'Notable' : 'Minor'"
        >
            <i class="fas fa-exclamation-triangle" v-if="event.impact" />
            <font-awesome-icon
                icon="fa-solid fa-circle-check"
                class="text-success"
                v-else
            />
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
        <span v-html="$md.render(event.content)" />
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
            return this.event.impact !== undefined;
        },
    },
    methods: {
        selectEvent () {
            this.$store.commit('dataCollection/setSelectedEventId', this.event.id);
        },
    },
};
</script>