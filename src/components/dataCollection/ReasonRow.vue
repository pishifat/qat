<template>
    <td>
        <!-- edit button -->
        <a
            href="#"
            data-toggle="modal"
            data-target="#editReason"
            :data-entry="event.id"
            @click.prevent="selectEvent()"
        >
            <i class="fas fa-edit" />
        </a>

        <!-- obviousness/severity -->
        <span v-if="hasData" :class="calculateColor">
            ({{ event.obviousness }}/{{ event.severity }})
        </span>

        <!-- dq reason -->
        <span v-html="filterLinks(event.content)" />
    </td>
</template>

<script>
import filterLinks from '../../mixins/filterLinks.js';

export default {
    name: 'ReasonRow',
    mixins: [filterLinks],
    props: {
        event: {
            type: Object,
            required: true,
        },
    },
    computed: {
        hasData() {
            return (this.event.obviousness || this.event.obviousness == 0) && (this.event.severity || this.event.severity == 0);
        },
        calculateColor() {
            let total = this.event.obviousness + this.event.severity;
            if (total >= 4 || this.event.obviousness == 2 || this.event.severity == 3) return 'text-success';
            else if (total >= 2) return 'text-neutral';
            else return 'text-danger';
        },
    },
    methods: {
        selectEvent () {
            this.$store.commit('setSelectedEventId', this.event.id);
        },
    },
};
</script>