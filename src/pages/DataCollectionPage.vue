<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search event...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
            />

            <events-table
                :events="disqualifications"
                :title="'Disqualifications'"
            />

            <events-table
                :events="pops"
                :title="'Nomination resets'"
            />
        </div>

        <data-collection-info />

        <toast-messages />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
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
            'disqualifications',
            'pops',
        ]),
    },
    async created() {
        const res = await this.executeGet('/dataCollection/relevantInfo');

        if (res) {
            this.$store.commit('setEvents', res.events);
            this.$store.commit('setFilterMode', res.mode);
        }

        $('#loading').fadeOut();
        $('#main').attr('style', 'visibility: visible').hide().fadeIn();
    },
};
</script>

<style>

</style>
