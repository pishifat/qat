<template>
    <div>
        <div class="ms-2">
            <h5>
                <a href="#rankedMapsNominated" data-bs-toggle="collapse">
                    Ranked maps nominated by you <i class="fas fa-angle-down" />
                </a>
            </h5>
        </div>

        <div id="rankedMapsNominated" class="collapse">
            <div class="ms-2">
                <p>You can select one map in every month as the "best" map you nominated. Selected maps will appear in the charts below with other nominators' selections. There is no objective criteria for what makes a map the "best" in this context, but please don't select joke/troll maps. If a month doesn't have any maps that you think are worth charting, you don't need to choose one. Read the longer text under <b>Monthly Charts</b> for more details.</p>
                <p>Maps are listed based on their Ranked dates. If a map is not Ranked yet, it won't be chart-able.</p>
                <hr>
            </div>

            <!-- Month/Year Selector -->
            <div class="d-flex flex-wrap align-items-center ms-2 mb-3">
                <select
                    v-model="selectedMonth"
                    class="form-select"
                    @change="loadNominationsForMonth"
                >
                    <option v-for="month in months" :key="month.value" :value="month.value">
                        {{ month.label }}
                    </option>
                </select>

                <select
                    v-model="selectedYear"
                    class="form-select ms-2"
                    @change="loadNominationsForMonth"
                >
                    <option v-for="year in years" :key="year" :value="year">
                        {{ year }}
                    </option>
                </select>

                <button
                    class="btn btn-sm btn-primary ms-2"
                    :disabled="loading"
                    @click="loadNominationsForMonth"
                >
                    {{ loading ? 'Loading...' : 'Load Nominations' }}
                </button>
            </div>
            <!-- Default Tables (Last 3 Months) -->
            <div v-if="isShowingDefault">
                <ranked-maps-table
                    v-for="monthData in defaultMonths"
                    :key="monthData.key"
                    :events="monthData.events"
                    :month-title="monthData.title"
                    class="mb-3"
                    @selection-changed="handleSelectionChange"
                />
            </div>

            <!-- Single Month Table -->
            <div v-else>
                <ranked-maps-table
                    :events="customEvents"
                    :month-title="customMonthTitle"
                    class="mb-3"
                    @selection-changed="handleSelectionChange"
                />
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import RankedMapsTable from './RankedMapsTable.vue';

export default {
    name: 'NominationCuration',
    components: {
        RankedMapsTable,
    },
    data() {
        return {
            selectedMonth: this.$moment().month() + 1,
            selectedYear: this.$moment().year(),
            loading: false,
            customMonthLoaded: false,
            customEvents: [],
            customMonthTitle: '',
            defaultMonths: [],
            isShowingDefault: true,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
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
            const years = [];

            // Generate years from 2020 to current year
            for (let year = 2020; year <= currentYear; year++) {
                years.push(year);
            }

            return years.reverse();
        },
        hasAnyEvents() {
            if (this.isShowingDefault) {
                return this.defaultMonths.some(month => month.events.length > 0);
            }

            return this.customEvents.length > 0;
        },
    },
    watch: {
        loggedInUser() {
            this.loadDefaultMonths();
        },
    },
    mounted() {
        this.loadDefaultMonths();
    },
    methods: {
        async loadDefaultMonths() {
            if (!this.loggedInUser) {
                this.defaultMonths = [];

                return;
            }

            try {
                // Create array of promises for all 3 months
                const monthPromises = [];

                for (let i = 0; i < 3; i++) {
                    const date = this.$moment().subtract(i, 'months');
                    const year = date.year();
                    const month = date.month() + 1;

                    monthPromises.push({
                        date,
                        promise: this.$http.executeGet(`/charts/${this.loggedInUser.id}/rankedNominations/${year}/${month}`),
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
                        });
                    }
                });

                this.defaultMonths = monthsData;
                this.isShowingDefault = true;
            } catch (error) {
                console.error('Failed to load default months:', error);
            }
        },
        async loadNominationsForMonth() {
            if (!this.loggedInUser) {
                this.customEvents = [];

                return;
            }

            // Check if the selected month is in our default months
            const currentMonthKey = `${this.selectedYear}-${this.selectedMonth}`;
            const existingMonth = this.defaultMonths.find(month => month.key === currentMonthKey);

            if (existingMonth) {
                // Month is in default range, but we need to switch to single view
                this.customEvents = existingMonth.events;
                this.customMonthTitle = existingMonth.title;
                this.customMonthLoaded = true;
                this.isShowingDefault = false;

                return;
            }

            this.loading = true;

            try {
                const response = await this.$http.executeGet(`/charts/${this.loggedInUser.id}/rankedNominations/${this.selectedYear}/${this.selectedMonth}`);

                if (response.error) {
                    console.error('Error loading ranked nominations:', response.error);
                    this.customEvents = [];
                } else {
                    this.customEvents = response.events || [];
                    this.customMonthTitle = this.$moment()
                        .year(this.selectedYear)
                        .month(this.selectedMonth - 1)
                        .format('MMMM YYYY');
                    this.customMonthLoaded = true;
                    this.isShowingDefault = false;
                }
            } catch (error) {
                console.error('Failed to load ranked nominations:', error);
                this.customEvents = [];
            } finally {
                this.loading = false;
            }
        },
        handleSelectionChange({ eventId, isSelected }) {
            // Update the event in the active month data
            if (this.customMonthLoaded) {
                const event = this.customEvents.find(e => e._id === eventId);

                if (event) {
                    this.updateEventSelection(event, isSelected);
                }
            } else {
                // Update in default months
                this.defaultMonths.forEach(monthData => {
                    const event = monthData.events.find(e => e._id === eventId);

                    if (event) {
                        this.updateEventSelection(event, isSelected);
                    }
                });
            }
        },
        updateEventSelection(event, isSelected) {
            if (!event.charted) {
                event.charted = [];
            }

            const userIndex = event.charted.indexOf(this.loggedInUser.id);

            if (isSelected && userIndex === -1) {
                event.charted.push(this.loggedInUser.id);
            } else if (!isSelected && userIndex !== -1) {
                event.charted.splice(userIndex, 1);
            }
        },
    },
};
</script>

<style scoped>
.d-flex select.form-control {
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