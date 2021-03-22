<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search event...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
                store-module="dataCollection"
            >
                <button class="btn btn-sm btn-block btn-primary mt-2" @click="isUnsetEvents ? loadRecentEvents($event) : loadUnsetEvents($event)">
                    {{ isUnsetEvents ? 'Load all events from the last 90 days' : 'Load events without obviousness or severity scores from the last year' }}
                </button>
            </filter-box>

            <events-table
                :events="disqualifications"
                title="Disqualifications"
                target="disqualifications"
            />

            <events-table
                :events="pops"
                title="Nomination resets"
                target="resets"
            />
        </div>

        <data-collection-info />

        <toast-messages />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import dataCollectionModule from '../store/dataCollection';
import ToastMessages from '../components/ToastMessages.vue';
import FilterBox from '../components/FilterBox.vue';
import DataCollectionInfo from '../components/dataCollection/DataCollectionInfo.vue';
import EventsTable from '../components/dataCollection/EventsTable.vue';

export default {
    name: 'DataCollectionPage',
    components: {
        ToastMessages,
        FilterBox,
        DataCollectionInfo,
        EventsTable,
    },
    data () {
        return {
            isUnsetEvents: false,
            isLoading: false,
        };
    },
    computed: {
        ...mapGetters([
            'userMainMode',
        ]),
        ...mapGetters('dataCollection', [
            'disqualifications',
            'pops',
        ]),
    },
    beforeCreate () {
        if (!this.$store.hasModule('dataCollection')) {
            this.$store.registerModule('dataCollection', dataCollectionModule);
        }
    },
    async created() {
        this.$store.commit('dataCollection/pageFilters/setFilterMode', this.userMainMode);

        const res = await this.$http.executeGet('/dataCollection/loadRecentEvents');

        if (res) {
            this.$store.commit('dataCollection/setEvents', res.events);
        }
    },
    methods: {
        async loadUnsetEvents(e) {
            console.log('a');
            this.isLoading = true;

            const res = await this.$http.executeGet('/dataCollection/loadUnsetEvents', e);

            if (res) {
                this.isLoading = false;
                this.isUnsetEvents = true;
                this.$store.commit('dataCollection/setEvents', res.events);
            }
        },
        async loadRecentEvents(e) {
            console.log('b');
            this.isLoading = true;

            const res = await this.$http.executeGet('/dataCollection/loadRecentEvents', e);

            if (res) {
                this.isLoading = false;
                this.isUnsetEvents = false;
                this.$store.commit('dataCollection/setEvents', res.events);
            }
        },
    },
};
</script>