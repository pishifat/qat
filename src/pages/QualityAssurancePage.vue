<template>
    <div>
        <div class="row">
            <div class="col-sm-12">
                <filter-box
                    :placeholder="'enter to search beatmap...'"
                    :options="['osu', 'taiko', 'catch', 'mania']"
                />
            </div>
        </div>

        <handbook />

        <section v-if="allEvents" class="segment segment-image mx-0 px-0">
            <div class="col-sm-12">
                <transition-group name="list" tag="div">
                    <event-row
                        v-for="event in filteredEvents"
                        :key="event.id"
                        :event="event"
                        :is-outdated="isOutdated(event.beatmapsetId, event.timestamp)"
                        :is-max-checks="event.qualityAssuranceCheckers.length > event.modes.length * 2 - 1"
                    />
                </transition-group>
            </div>
            <div class="text-center">
                <button
                    class="btn btn-sm btn-nat mt-4 mx-auto"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="show 200 more events throughout all modes"
                    @click="loadMore($event)"
                >
                    <i class="fas fa-angle-down mr-1" /> show more <i class="fas fa-angle-down ml-1" />
                </button>
            </div>
        </section>

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
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
        ...mapState([
            'overwriteEvents',
        ]),
        ...mapGetters([
            'allEvents',
            'filteredEvents',
        ]),
        sevenDaysAgo() {
            let date = new Date();
            date.setDate(date.getDate() - 7);

            return date;
        },
    },
    async created() {
        const res = await this.executeGet('/qualityAssurance/relevantInfo');

        if (res) {
            this.$store.commit('setEvents', res.maps);
            this.$store.commit('setOverwriteEvents', res.overwrite);
            this.$store.commit('setUserId', res.userId);
            this.$store.commit('setUserOsuId', res.userOsuId);
            this.$store.commit('setUsername', res.username);
            this.$store.commit('setIsNat', res.isNat);
            this.$store.commit('setIsUser', res.isUser);
            this.$store.commit('setFilterMode', res.mode);
        }

        $('#loading').fadeOut();
        $('#main')
            .attr('style', 'visibility: visible')
            .hide()
            .fadeIn();

    },
    mounted() {
        setInterval(async () => {
            const res = await this.executeGet('/qualityAssurance/relevantInfo');

            if (res) {
                this.$store.commit('setEvents', res.maps);
                this.$store.commit('setOverwriteEvents', res.overwrite);
            }
        }, 600000);
    },
    methods: {
        isOutdated(beatmapsetId, timestamp) {
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
        async loadMore(e) {
            const res = await this.executeGet('/qualityAssurance/loadMore/' + this.limit + '/' + (this.limit - 200), e);

            if (res) {
                this.$store.commit('addEvents', res.maps);
                this.limit += 200;
            }
        },
    },
};
</script>

<style>
</style>
