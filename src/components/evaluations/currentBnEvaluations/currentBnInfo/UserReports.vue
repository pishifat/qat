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
                <a :href="'http://bn.mappersguild.com/managereports?report=' + report.id">{{ report.createdAt.slice(0,10) }}</a>
                <div
                    class="pre-line"
                    :class="report.valid == 1 ? 'text-success' : ''"
                    v-html="filterLinks(report.reason)"
                />
            </li>
        </ul>
    </div>
</template>

<script>
import filterLinks from '../../../../mixins/filterLinks.js';
import postData from '../../../../mixins/postData.js';

export default {
    name: 'UserReports',
    mixins: [filterLinks, postData],
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
            const res = await this.executeGet('/bnEval/findUserReports/' + this.userMongoId);

            if (res) {
                this.userReports = res.userReports;
            }
        },
    },
};
</script>