<template>
    <div class="row">
        <div class="col-sm-12">
            <filter-box
                :placeholder="'enter to search beatmap...'"
                :options="['osu', 'taiko', 'catch', 'mania']"
                store-module="qualityAssurance"
            />

            <handbook />

            <section class="card card-body">
                <transition-group name="list" tag="div">
                    <event-row
                        v-for="event in filteredEvents"
                        :key="event.id"
                        :event="event"
                        :is-outdated="isOutdated(event.beatmapsetId, event.timestamp)"
                        :is-max-checks="event.qualityAssuranceCheckers.length > event.modes.length * 2 - 1"
                    />
                </transition-group>

                <div class="text-center">
                    <button
                        class="btn btn-sm btn-primary mt-4 mx-auto"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="show 200 more events throughout all modes"
                        @click="loadMore($event)"
                    >
                        <i class="fas fa-angle-down mr-1" /> show more <i class="fas fa-angle-down ml-1" />
                    </button>
                </div>
            </section>
        </div>

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import qualityAssuranceModule from '../store/qualityAssurance';
import ToastMessages from '../components/ToastMessages.vue';
import postData from '../mixins/postData.js';
import FilterBox from '../components/FilterBox.vue';
import EventRow from '../components/qualityAssurance/EventRow.vue';
import Handbook from '../components/qualityAssurance/Handbook.vue';

export default {
    name: 'QualityAssurancePage',
    components: {
        ToastMessages,
        FilterBox,
        EventRow,
        Handbook,
    },
    mixins: [postData],
    data() {
        return {
            limit: 200,
        };
    },
    computed: {
        ...mapGetters([
            'userMainMode',
        ]),
        ...mapState('qualityAssurance', [
            'events',
            'overwriteEvents',
        ]),
        ...mapGetters('qualityAssurance', [
            'filteredEvents',
        ]),
        sevenDaysAgo() {
            let date = new Date();
            date.setDate(date.getDate() - 7);

            return date;
        },
    },
    beforeCreate () {
        if (!this.$store.hasModule('qualityAssurance')) {
            this.$store.registerModule('qualityAssurance', qualityAssuranceModule);
        }
    },
    async created() {
        this.$store.commit('qualityAssurance/pageFilters/setFilterMode', this.userMainMode);
        const data = await this.initialRequest('/qualityAssurance/relevantInfo');

        if (data) {
            this.$store.commit('qualityAssurance/setEvents', data.events);
            this.$store.commit('qualityAssurance/setOverwriteEvents', data.overwrite);
        }
    },
    mounted() {
        setInterval(async () => {
            const data = await this.executeGet('/qualityAssurance/relevantInfo');

            if (data) {
                this.$store.commit('qualityAssurance/setEvents', data.events);
                this.$store.commit('qualityAssurance/setOverwriteEvents', data.overwrite);
            }
        }, 600000);
    },
    methods: {
        isOutdated (beatmapsetId, timestamp) {
            timestamp = new Date(timestamp);

            if (timestamp < this.sevenDaysAgo) {
                return true;
            } else {
                let beatmaps = this.filteredEvents.filter(b => b.beatmapsetId == beatmapsetId && b.timestamp != timestamp);
                beatmaps = beatmaps.concat(this.overwriteEvents.filter(b => b.beatmapsetId == beatmapsetId));
                let isOutdated = false;

                for (let i = 0; i < beatmaps.length; i++) {
                    const b = beatmaps[i];

                    if (new Date(b.timestamp) > timestamp) {
                        isOutdated = true;
                        break;
                    }
                }

                return isOutdated;
            }
        },
        async loadMore (e) {
            const res = await this.executeGet('/qualityAssurance/loadMore/' + this.limit + '/' + (this.limit - 200), e);

            if (res) {
                this.$store.commit('qualityAssurance/addEvents', res.events);
                this.limit += 200;
            }
        },
    },
};
</script>
