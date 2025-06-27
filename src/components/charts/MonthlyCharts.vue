<template>
    <div>
        <div class="ml-2">
            <h4>Monthly Charts</h4>
            <p>This page was inspired by the <a href='https://osu.ppy.sh/home/news/2025-06-25-survey-the-state-of-ranked' target="_blank">State of Ranked survey</a>. Fill it out if you haven't already!</p>
            <p class="pt-3"><b>Monthly Charts</b> are a way for BNs to collectively curate their nominations. Every BN can pick <b>one map every month</b> as the "best" map they've promoted to the Ranked section. Any other BN can upvote or downvote a map on the list.</p>
            <p>This page is mainly meant to be a fun thing for mappers to look at. It shouldn't be taken too seriously, since there are no consequences for a map's placement on a chart.</p>
            <p class="pt-3">Historically, the Ranked section was viewed as a source of high quality beatmaps curated by established members of the mapping community. Today, that perspective is seen as outdated. Some people claim that Ranked map quality is the worst its ever been, while others think it's fine. Some people claim that there are too many Ranked maps nowadays, while others want more. There is no shared understanding of what Ranked is at this point.</p>
            <p>Mappers seem to complain about the quality of the Ranked section more than players (which may be confirmed by the survey), but because mappers are a much smaller portion of the osu! audience, there's a lot of conflict when deciding how to handle the Ranked section. That said, if you're looking for maps that represent the values of mappers, the <b>Monthly Charts</b> might give you that.</p>
            <hr>
        </div>
        
        <!-- Month/Year/Mode Selector -->
        <div class="form-inline ml-2 mb-3">
            <select
                v-model="selectedMode"
                class="form-control"
                @change="loadChartedEvents"
            >
                <option value="osu">osu!</option>
                <option value="taiko">osu!taiko</option>
                <option value="catch">osu!catch</option>
                <option value="mania">osu!mania</option>
            </select>
            
            <select
                v-model="selectedMonth"
                class="form-control ml-2"
                @change="loadChartedEvents"
            >
                <option v-for="month in months" :key="month.value" :value="month.value">
                    {{ month.label }}
                </option>
            </select>
            
            <select
                v-model="selectedYear"
                class="form-control ml-2"
                @change="loadChartedEvents"
            >
                <option v-for="year in years" :key="year" :value="year">
                    {{ year }}
                </option>
            </select>
            
            <button 
                class="btn btn-sm btn-primary ml-2" 
                @click="loadChartedEvents"
                :disabled="loading"
            >
                {{ loading ? 'Loading...' : 'Load Charts' }}
            </button>
        </div>
        
        <!-- Default Tables (Last 3 Months) -->
        <div v-if="isShowingDefault">
            <charted-maps-table
                v-for="monthData in defaultMonths"
                :key="monthData.key"
                :events="monthData.events"
                :month-title="monthData.title"
                class="mb-4"
            />
        </div>
        
        <!-- Single Month Table -->
        <div v-else>
            <charted-maps-table
                :events="events"
                :month-title="monthTitle"
                class="mb-4"
            />
        </div>
    </div>
</template>

<script>
import ChartedMapsTable from './ChartedMapsTable.vue';

export default {
    name: 'MonthlyCharts',
    components: {
        ChartedMapsTable,
    },
    data() {
        return {
            selectedMode: 'osu',
            selectedMonth: this.$moment().month() + 1,
            selectedYear: this.$moment().year(),
            loading: false,
            events: [],
            monthTitle: '',
            defaultMonths: [],
            isShowingDefault: true,
        };
    },
    computed: {
        months() {
            const months = [];
            for (let i = 0; i < 12; i++) {
                months.push({
                    value: i + 1,
                    label: this.$moment().month(i).format('MMMM'),
                });
            }
            return months;
        },
        years() {
            const currentYear = this.$moment().year();
            return Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);
        },
    },
    mounted() {
        this.setDefaultMode();
        this.loadDefaultMonths();
    },
    watch: {
        selectedMode() {
            // Reload default months when mode changes
            if (this.isShowingDefault) {
                this.loadDefaultMonths();
            }
        },
    },
    methods: {
        setDefaultMode() {
            // Set default mode based on user's modesInfo, fallback to 'osu'
            if (this.$store.state.loggedInUser && this.$store.state.loggedInUser.modesInfo && this.$store.state.loggedInUser.modesInfo.length > 0) {
                const userMode = this.$store.state.loggedInUser.modesInfo[0].mode;
                this.selectedMode = userMode === 'none' ? 'osu' : userMode;
            } else {
                this.selectedMode = 'osu';
            }
        },
        async loadDefaultMonths() {
            this.loading = true;
            
            try {
                // Create array of promises for last 3 months
                const monthPromises = [];
                
                for (let i = 0; i < 3; i++) {
                    const date = this.$moment().subtract(i, 'months');
                    const year = date.year();
                    const month = date.month() + 1;
                    
                    monthPromises.push({
                        date,
                        promise: this.$http.executeGet(`/charts/month/${year}/${month}?mode=${this.selectedMode}`)
                    });
                }
                
                // Execute all requests in parallel
                const results = await Promise.all(monthPromises.map(item => item.promise));
                
                // Process results
                const monthsData = [];
                results.forEach((response, index) => {
                    if (!response.error) {
                        const date = monthPromises[index].date;
                        monthsData.push({
                            key: `${date.year()}-${date.month() + 1}`,
                            title: date.format('MMMM YYYY'),
                            events: response.events || [],
                            mode: this.selectedMode,
                        });
                    }
                });
                
                this.defaultMonths = monthsData;
                this.isShowingDefault = true;
            } catch (error) {
                console.error('Failed to load default months:', error);
            } finally {
                this.loading = false;
            }
        },
        async loadChartedEvents() {
            // Check if the selected month is in our default months and mode matches
            const currentMonthKey = `${this.selectedYear}-${this.selectedMonth}`;
            const existingMonth = this.defaultMonths.find(month => month.key === currentMonthKey);
            
            if (existingMonth && existingMonth.mode === this.selectedMode) {
                // Month is in default range and mode matches, switch to single view
                this.events = existingMonth.events;
                this.monthTitle = existingMonth.title;
                this.isShowingDefault = false;
                return;
            }
            
            // Load custom month or reload with different mode
            this.loading = true;
            
            try {
                const response = await this.$http.executeGet(`/charts/month/${this.selectedYear}/${this.selectedMonth}?mode=${this.selectedMode}`);
                
                if (response.error) {
                    console.error('Error loading charted events:', response.error);
                    this.events = [];
                } else {
                    this.events = response.events || [];
                    this.monthTitle = this.$moment()
                        .year(this.selectedYear)
                        .month(this.selectedMonth - 1)
                        .format('MMMM YYYY');
                    this.isShowingDefault = false;
                }
            } catch (error) {
                console.error('Failed to load charted events:', error);
                this.events = [];
            } finally {
                this.loading = false;
            }
        },
    },
};
</script>

<style scoped>
div.form-inline select.form-control {
    margin: 0 !important;
    padding: 0 0.75rem !important;
    vertical-align: middle !important;
    border-radius: 8px !important;
    -webkit-border-radius: 8px !important;
    -moz-border-radius: 8px !important;
    border-top-left-radius: 8px !important;
    border-top-right-radius: 8px !important;
    border-bottom-left-radius: 8px !important;
    border-bottom-right-radius: 8px !important;
}
</style>