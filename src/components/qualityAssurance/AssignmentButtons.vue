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
import { mapState } from 'vuex';

export default {
    name: 'AssignmentButtons',
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
    computed: {
        ...mapState('qualityAssurance', [
            'pageFilters',
        ]),
    },
    methods: {
        async assignUser () {
            this.forceDisabled = true;
            const event = await this.$http.executePost('/qualityAssurance/assignUser/' + this.eventId + '/' + this.pageFilters.filters.mode, {});

            if (event) {
                this.$store.commit('qualityAssurance/updateEvent', event);
                this.forceDisabled = false;
            }
        },
        async unassignUser () {
            this.forceDisabled = true;
            const event = await this.$http.executePost('/qualityAssurance/unassignUser/' + this.eventId, {});

            if (event && !event.error) {
                this.$store.commit('qualityAssurance/updateEvent', event);
                this.forceDisabled = false;
            }
        },
    },
};
</script>

