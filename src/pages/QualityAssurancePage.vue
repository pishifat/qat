<template>
    <div>
        <div class="row">
            <div class="col-sm-12">
                <filter-box
                    :filter-mode.sync="filterMode"
                    :filter-value.sync="filterValue"
                    :placeholder="'metadata...'"
                    :options="['osu', 'taiko', 'catch', 'mania']"
                />
            </div>
        </div>

        <section class="segment mx-4 my-1">
            <a data-toggle="collapse" href="#howToUse">Quality Assurance Helpers handbook (aka: how do I use this page?) <i class="fas fa-angle-down" /></a>
            <div id="howToUse" class="collapse mt-4 mx-4">
                <div class="container">
                    <p class="min-spacing">
                        What is the "Quality Assurance Helpers"?
                    </p>
                    <p class="small ml-4">
                        The Quality Assurance Helpers (QAH) is a the final system in place to ensure beatmaps with unrankable issues do not reach the ranked section.
                    </p>
                    <p class="small ml-4">
                        The system involves full BN and NAT members reviewing qualified maps for large potential issues, usually not involving extensive modding as would be done while the beatmap is pending. Like nomination-related activities, checking beatmaps through the QAH system counts towards a BN's overall activity.
                    </p>
                    <p class="min-spacing">
                        How do I participate?
                    </p>
                    <p class="small ml-4">
                        Any BN who is not on probation or NAT member may contribute by clicking on the buttons on the right side of any beatmap card. The
                        <button
                            class="btn btn-xs btn-nat-green p-1"
                        >
                            <i class="fas fa-plus vote-pass" />
                        </button>
                        button should be used when you've checked a beatmap and are 100% there are no unrankable issues. The
                        <button
                            class="btn btn-xs btn-nat-red p-1"
                        >
                            <i class="fas fa-minus vote-fail" />
                        </button>
                        button can be used if you accidentally mark the wrong beatmap.
                    </p>
                    <p class="min-spacing">
                        What are the rules for adding myself to a card?
                    </p>
                    <p class="small ml-4">
                        You can only mark yourself as a QA checker for beatmaps that you did not participate in or nominate. The purpose of this system is to ensure that all beatmaps are thoroughly checked, and if you nominated a beatmap or created it yourself, you (hopefully) believe the beatmap has no problems already!
                    </p>
                    <p class="small ml-4">
                        You should only mark yourself as a QA checker on beatmaps in modes you are qualified for. For example, if you're not an osu!taiko BN, don't mark yourself on any osu!taiko beatmaps.
                    </p>
                    <p class="min-spacing">
                        What else is there to know?
                    </p>
                    <p class="small ml-4">
                        As part of the transition from Trello to this website, the first QA check on every beatmap is intended to be anonymous. This is to avoid users piggybacking on other users with the assumption that they already checked the beatmap thoroughly. That said, ONLY mark beatmaps that you've checked. If you're marking yourself as a QA checker to see which other user(s) have checked the beatmap, you're doing it wrong and you'll likely be told to stop using the QA system.
                    </p>
                    <p class="small ml-4 min-spacing">
                        Additionally, beatmaps that meet any of the following conditions will appear transparent on the listing below, and will not be edit-able.
                    </p>
                    <ul class="small">
                        <li>beatmaps that are ranked</li>
                        <li>beatmaps that are disqualified</li>
                        <li>beatmaps that have reached enough QA checks (2 per mode)</li>
                    </ul>
                    <p class="small ml-4">
                        If a beatmap is re-qualified after a disqualification, it will have two entries on the listing: one from the first qualification, and one from the second. The first will not be edit-able, while the second will be. We recommend checking re-qualified beatmaps again, since issues could have arisen while the beatmap was being updated!
                    </p>
                    <p class="small ml-4">
                        The due date on every beatmap card indicates 7 days from its most recent qualification. Re-qualified beatmaps may have editing access disabled before their actual due date because of rolling DQ timers.
                    </p>
                </div>
            </div>
        </section>

        <section class="segment segment-image mx-0 px-0">
            <div class="col-sm-12">
                <transition-group name="list" tag="div">
                    <event-row
                        v-for="event in pageObjs"
                        :key="event.id"
                        :event="event"
                        :user-id="userId"
                        :is-nat="isNat"
                        :user-osu-id="userOsuId"
                        :username="username"
                        :is-outdated="isOutdated(event.beatmapsetId, event.timestamp)"
                        :is-max-checks="event.qualityAssuranceCheckers.length > event.modes.length * 2 - 1"
                        @update-event="updateEvent($event)"
                    />
                </transition-group>
            </div>
            <div class="text-center">
                <button class="btn btn-sm btn-nat mt-4 mx-auto" @click="loadMore()">
                    <i class="fas fa-angle-down mr-1" /> show more <i class="fas fa-angle-down ml-1" />
                </button>
            </div>
        </section>
    </div>
</template>

<script>
import filters from '../mixins/filters.js';
import postData from '../mixins/postData.js';
import FilterBox from '../components/FilterBox.vue';
import EventRow from '../components/qualityAssurance/EventRow.vue';

export default {
    name: 'QualityAssurancePage',
    components: {
        FilterBox,
        EventRow,
    },
    mixins: [filters, postData],
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            filteredObjs: null,
            overwriteEvents: null,
            userId: null,
            userOsuId: null,
            username: null,
            isNat: null,
            limit: 50,
        };
    },
    computed: {
        sevenDaysAgo() {
            let date = new Date();
            date.setDate(date.getDate() - 7);

            return date;
        },
    },
    async created() {
        const res = await this.executeGet('/qualityAssurance/relevantInfo');

        if (res) {
            this.allObjs = res.maps;
            this.overwriteEvents = res.overwrite;
            this.userId = res.userId;
            this.userOsuId = res.userOsuId;
            this.username = res.username;
            this.isNat = res.isNat;
            this.filterMode = res.mode;
            this.hasPagination = false;
            this.filter();
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
                this.allObjs = res.maps;
                this.overwriteEvents = res.overwrite;

                if (this.isFiltered) {
                    this.filter();
                }
            }
        }, 600000);
    },
    methods: {
        filterBySearchValueContext(v) {
            if (v.metadata.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1) {
                return true;
            }

            return false;
        },
        isOutdated(beatmapsetId, timestamp) {
            timestamp = new Date(timestamp);

            if (timestamp < this.sevenDaysAgo) {
                return true;
            } else {
                let beatmaps = this.pageObjs.filter(b => b.beatmapsetId == beatmapsetId && b.timestamp != timestamp);
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
        updateEvent(event) {
            const i = this.allObjs.findIndex(e => e.id == event.id);
            this.allObjs[i] = event;
            this.filter();
        },
        async loadMore() {
            const res = await this.executeGet('/qualityAssurance/loadMore/' + this.limit + '/' + (this.limit - 50));

            if (res) {
                this.allObjs = this.allObjs.concat(res.maps);
                this.limit += 50;
                this.filter();
            }
        },
    },
};
</script>

<style>
</style>
