<template>
    <div class="d-flex justify-content-end align-items-center pr-0">
        <div v-if="info" class="small errors">
            {{ info }}
        </div>
        <button
            v-if="isQualityAssuranceChecker"
            data-toggle="tooltip"
            data-placement="top"
            title="toggle QA checker"
            class="btn btn-xs btn-nat-red p-1"
            :disabled="forceDisabled"
            @click.prevent="unassignUser($event)"
        >
            <i class="fas fa-minus vote-fail" />
        </button>
        <button
            v-else-if="!isMaxChecks"
            data-toggle="tooltip"
            data-placement="top"
            title="toggle QA checker"
            class="btn btn-xs btn-nat-green p-1"
            :disabled="forceDisabled"
            @click.prevent="assignUser($event)"
        >
            <i class="fas fa-plus vote-pass" />
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
            info: '',
        };
    },
    methods: {
        async assignUser () {
            this.forceDisabled = true;
            const qualityAssuranceCheckers = await this.executePost('/qualityAssurance/assignUser/' + this.eventId, {});

            if (qualityAssuranceCheckers) {
                if (qualityAssuranceCheckers.error) {
                    this.info = qualityAssuranceCheckers.error;
                } else {
                    this.$emit('update-quality-assurance-checkers', { id: this.eventId, value: qualityAssuranceCheckers });
                }

                this.forceDisabled = false;
            }
        },
        async unassignUser () {
            this.forceDisabled = true;
            const qualityAssuranceCheckers = await this.executePost('/qualityAssurance/unassignUser/' + this.eventId, {});

            if (qualityAssuranceCheckers) {
                if (qualityAssuranceCheckers.error) {
                    this.info = qualityAssuranceCheckers.error;
                } else {
                    this.$emit('update-quality-assurance-checkers', { id: this.eventId, value: qualityAssuranceCheckers });
                }

                this.forceDisabled = false;
            }
        },
    },
};
</script>

