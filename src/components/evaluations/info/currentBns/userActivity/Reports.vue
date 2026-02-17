<template>
    <div>
        <div class="ml-2">
            <a
                :href="userReports && `#${eventId}`"
                data-toggle="collapse"
            >{{ header }} <i class="fas fa-angle-down" /></a>
            ({{ !userReports ? '...' : userReports.length }})
        </div>

        <div v-if="userReports" :id="eventId" class="collapse">
            <ul class="small text-secondary">
                <p v-if="!userReports">
                    ...
                </p>
                <p v-else-if="!userReports.length">
                    None...
                </p>
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
    </div>
</template>

<script>
export default {
    name: 'Reports',
    props: {
        header: {
            type: String,
            required: true,
        },
        eventId: {
            type: String,
            required: true,
        },
        mongoId: {
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
        mongoId() {
            this.findUserReports();
        },
    },
    mounted() {
        this.findUserReports();
    },
    methods: {
        async findUserReports() {
            this.userReports = null;
            const res = await this.$http.executeGet('/bnEval/findUserReports/' + this.mongoId);

            if (res) {
                this.userReports = res.userReports;
            }
        },
    },
};
</script>
