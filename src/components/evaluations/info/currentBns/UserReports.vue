<template>
    <div>
        <p>
            <b>Reports:</b>
        </p>

        <ul class="small text-secondary">
            <li v-if="!userReports">
                ...
            </li>
            <li v-else-if="!userReports.length">
                User has no reports
            </li>
            <li
                v-for="report in userReports"
                v-else
                :key="report.id"
            >
                <a :href="'/managereports?id=' + report.id">{{ toStandardDate(report.createdAt) }}</a>
                -
                <span :class="`text-${report.valid == 1 ? 'success' : report.valid == 2 ? 'neutral' : report.valid == 3 ? 'danger' : ''}`">
                    {{ report.valid == 1 ? 'VALID' : report.valid == 2 ? 'PARTIALLY VALID' : report.valid == 3 ? 'INVALID' : '' }}
                </span>

                <div v-html="$md.render(report.reason)" />
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'UserReports',
    props: {
        userMongoId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            userReports: null,
        };
    },
    watch: {
        userMongoId() {
            this.findUserReports();
        },
    },
    mounted() {
        this.findUserReports();
    },
    methods: {
        async findUserReports() {
            this.userReports = null;
            const res = await this.$http.executeGet('/bnEval/findUserReports/' + this.userMongoId);

            if (res) {
                this.userReports = res.userReports;
            }
        },
    },
};
</script>