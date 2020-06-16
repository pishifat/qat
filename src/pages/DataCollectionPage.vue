<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search event...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
                store-module="dataCollection"
            />

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
import postData from '../mixins/postData.js';
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
    mixins: [postData],
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

        const res = await this.executeGet('/dataCollection/relevantInfo');

        if (res) {
            this.$store.commit('dataCollection/setEvents', res.events);
        }
    },
};
</script>