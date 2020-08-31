<template>
    <div class="card card-body">
        <h4 class="text-center">
            Report
            <span v-if="report.culprit">
                of
                <a :href="'https://osu.ppy.sh/users/' + report.culprit.osuId" target="_blank">
                    {{ report.culprit.username }}
                </a>
            </span>
            by
            <a :href="'https://osu.ppy.sh/users/' + report.reporter.osuId" target="_blank">
                {{ report.reporter.username }}
            </a>
        </h4>
        <h5 v-if="report.valid" class="text-center">
            Consensus:
            <span :class="consensusColor" class="text-capitalize">{{ consensusText }}</span>
            <span v-if="addition" :class="consensusColor" class="text-capitalize"> + {{ additionText }}</span>
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

export default {
    name: 'ReportFeedback',
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
        consensusText() {
            switch (this.report.valid) {
                case 1:
                    return 'Valid';
                case 2:
                    return 'Partially valid';
                default: // case 3:
                    return 'Invalid';
            }
        },
    },
};
</script>
