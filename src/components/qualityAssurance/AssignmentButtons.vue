<template>
    <div>
        <a
            v-if="isQualityAssuranceChecker"
            data-toggle="tooltip"
            data-placement="top"
            title="toggle QA checker"
            class="btn btn-sm btn-link"
            :disabled="forceDisabled"
            @click.prevent="unassignUser($event)"
        >
            <i class="fas fa-minus text-danger" />
        </a>

        <button
            v-else-if="!isMaxChecks"
            data-toggle="tooltip"
            data-placement="top"
            title="toggle QA checker"
            class="btn btn-sm btn-link"
            :disabled="forceDisabled"
            @click.prevent="assignUser($event)"
        >
            <i class="fas fa-plus text-success" />
        </button>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'AssignmentButtons',
    mixins: [postData],
    props: {
        eventId: {
            type: String,
            required: true,
        },
        isQualityAssuranceChecker: Boolean,
        isMaxChecks: Boolean,
    },
    data() {
        return {
            forceDisabled: false,
        };
    },
    methods: {
        async assignUser () {
            this.forceDisabled = true;
            const event = await this.executePost('/qualityAssurance/assignUser/' + this.eventId, {});

            if (event) {
                this.$store.commit('updateEvent', event);
                this.forceDisabled = false;
            }
        },
        async unassignUser () {
            this.forceDisabled = true;
            const event = await this.executePost('/qualityAssurance/unassignUser/' + this.eventId, {});

            if (event && !event.error) {
                this.$store.commit('updateEvent', event);
                this.forceDisabled = false;
            }
        },
    },
};
</script>

