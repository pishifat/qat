<template>
    <div>
        <div class="container">
            <div class="row">
                <span class="col-sm-12 small text-secondary mb-2">
                    This takes some time to load and is resource-intensive. Use sparingly.
                </span>
            </div>
            <div class="row">
                <div class="col-sm-12 form-inline">
                    <label for="date">Start date:</label>
                    <input 
                        v-model="minDate"
                        class="form-control mx-2"
                        type="date"
                        placeholder="Start date..." 
                    />
                    <label for="date">End date:</label>
                    <input 
                        v-model="maxDate"
                        class="form-control mx-2"
                        type="date"
                        placeholder="End date..."
                    />
                    <button
                        class="btn btn-sm btn-primary"
                        @click="getStats($event)"
                    >
                        Load stats
                    </button>
                </div>
            </div>
            <div v-if="jsonData" class="row">
                <div class="col-sm-12">
                    <hr />
                        <a href="#expandJson" data-toggle="collapse">
                            view full JSON <i class="fas fa-angle-down" />
                        </a>
                        <br>
                    <pre id="expandJson" class="collapse container">{{ JSON.stringify(jsonData, null, 4) }}</pre>
                    <br>
                </div>
                <div class="col-sm-12">
                    <h4>Mode stats</h4>
                    <pre>{{ 'mode,uniqueNominations,uniqueMappers,uniqueMappersPercentage\n' + getModeStats() }}</pre>
                </div>
                <div class="col-sm-12" v-for="mode in modes" :key="mode">
                    <h4 v-if="mode">{{ formatMode(mode) }}</h4>
                    <pre>{{ 'userId,username,uniqueNominationCount,uniqueMapperCount,uniqueMappersPercentage,dqCount,minorCount,notableCount,severeCount,nomScore\n' + getStatsCsvByMode(mode) }}</pre>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'EliteNominatorStats',
    components: {
        UserLink,
    },
    data () {
        return {
            minDate: null,
            maxDate: null,
            jsonData: null,
            modes: ['osu', 'taiko', 'catch', 'mania', 'none', 'resigned'],
            modeStats: [],
            nominatorStats: [],
        };
    },
    methods: {
        async getStats(e) {
            this.$store.dispatch('updateToastMessages', {
                message: `Loading, this will take a while...`,
                type: 'info',
            });

            const data = await this.$http.executeGet(`/users/getEliteNominatorStats?minDate=${this.minDate}&maxDate=${this.maxDate}`, e);

            if (this.$http.isValid(data)) {
                this.jsonData = data;
                this.modeStats = data.modeStats;
                this.nominatorStats = data.nominatorStats;
            }
        },
        parseData() {
            const parsedData = JSON.parse(this.jsonData);
            this.modeStats = parsedData.modeStats;
            this.nominatorStats = parsedData.nominatorStats;
        },
        getStatsByMode(mode) {
            if (!this.nominatorStats) return [];
            return this.nominatorStats.filter(user => user.modes.includes(mode));
        },
        getStatsCsvByMode(mode) {
            const stats = this.getStatsByMode(mode);
            return stats.map(user => `${user.userId},${user.username},${user.uniqueNominationCount},${user.uniqueMapperCount},${user.uniqueMappersPercentage},${user.disqualifyCount},${user.minorDisqualifyCount},${user.notableDisqualifyCount},${user.severeDisqualifyCount},${user.nomScore}`).join('\n');
        },
        getModeStats() {
            return this.modeStats.map(stat => `${stat.mode},${stat.uniqueNominations},${stat.uniqueMappers},${stat.uniqueMappersPercentage}`).join('\n');
        },
    },
};
</script>
