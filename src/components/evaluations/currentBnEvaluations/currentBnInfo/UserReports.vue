<template>
    <div>
        <p class="min-spacing text-shadow">
            Reports:
        </p>
        <ul v-if="userReports">
            <li v-if="!userReports.length" class="small min-spacing text-shadow">User has no reports</li>
            <li v-else v-for="report in userReports" :key="report.id" class="small text-shadow">
                <a :href="'http://bn.mappersguild.com/managereports?report=' + report.id">{{ report.createdAt.slice(0,10) }}</a>
                <pre class="secondary-text pre-font ml-2" :class="report.valid == 1 ? 'vote-pass' : 'vote-extend'"> <span v-html="filterLinks(report.reason)" /></pre>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'user-reports',
    props: {
        userMongoId: String,
    },
    watch: {
        userMongoId() {
            this.findUserReports();
        },
    },
    data() {
        return {
            userReports: null,
        };
    },
    mounted() {
        this.findUserReports();
    },
    methods: {
        findUserReports() {
            this.userReports = null;
            axios
                .get('/bnEval/findUserReports/' + this.userMongoId)
                .then(response => {
                    this.userReports = response.data.userReports;
                });
        }
    },
};
</script>
