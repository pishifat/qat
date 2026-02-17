<template>
    <div class="card card-body">
        <h4 class="text-center">
            Report
            <span v-if="report.culprit">
                of
                <user-link
                    :osu-id="report.culprit.osuId"
                    :username="report.culprit.username"
                />
            </span>
            by
            <user-link
                :osu-id="report.reporter.osuId"
                :username="report.reporter.username"
            />
        </h4>
        <h5 v-if="report.category" class="text-center">
            Category:
            <span class="text-secondary">{{ categoryText }}</span>
        </h5>
        <h5 v-if="report.valid" class="text-center">
            Consensus:
            <span :class="consensusColor" class="text-capitalize">{{ consensusText }}</span>
        </h5>

        <div>
            <div v-if="report.link">
                <h5>Relevant link</h5>
                <span class="mb-4" v-html="$md.render(report.link)" />
            </div>

            <h5>Report</h5>
            <div class="card card-body small mb-4" v-html="$md.render(report.reason)" />

            <h5>Feedback</h5>
            <div class="card card-body small mb-4" v-html="$md.render(report.feedback)" />
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'ReportFeedback',
    components: {
        UserLink,
    },
    props: {
        report: {
            type: Object,
            required: true,
        },
    },
    computed: {
        /** @returns {string} */
        consensusColor() {
            switch (this.report.valid) {
                case 1:
                    return 'text-pass';
                case 2:
                    return 'text-neutral';
                default: // case 3:
                    return 'text-fail';
            }
        },
        /** @returns {string} */
        consensusText() {
            switch (this.report.valid) {
                case 1:
                    if (this.report.isContentCase) {
                        return 'Valid for use';
                    } else {
                        return 'Valid';
                    }

                case 2:
                    return 'Partially valid';

                default: // case 3:
                    if (this.report.isContentCase) {
                        return 'Invalid for use';
                    } else {
                        return 'Invalid';
                    }
            }
        },
        /** @returns {string} */
        categoryText() {
            let word = this.report.category;

            word = word.replace(/([a-z])([A-Z])/g, '$1 $2');
            word = word.charAt(0).toUpperCase() + word.slice(1);

            return word;
        },
    },
};
</script>
