<template>
    <div class="row">
        <div class="col-md-12">
            <section class="segment my-1">
                <small>Search:
                    <input
                        id="search"
                        v-model="filterValue"
                        class="ml-1"
                        type="text"
                        placeholder="beatmap..."
                    >
                </small>
                <small class="ml-1">
                    <select id="mode" v-model="filterMode" class="custom-select">
                        <option class="ml-2" value="" selected>All modes</option>
                        <option class="ml-2" value="osu">osu!</option>
                        <option class="ml-2" value="taiko">osu!taiko</option>
                        <option class="ml-2" value="catch">osu!catch</option>
                        <option class="ml-2" value="mania">osu!mania</option>
                    </select>
                </small>
            </section>
            <section class="segment my-1">
                <a data-toggle="collapse" href="#howToUse">How do I use this page? <i class="fas fa-angle-down" /></a>
                <div id="howToUse" class="collapse mt-4 mx-2">
                    <p class="mx-2">
                        This page is used to make BN evaluations more consistent and convenient. As a member of the NAT, your roles here are to...
                    </p>
                    <h5>Shorten "reason" information</h5>
                    <p class="mx-2">
                        DQ/reset reasons are inconsistent, too wordy, and can be misleading (especially when written by BNs). By editing the reason, you'll be able to fix those problems.
                    </p>
                    <p class="mx-2">
                        Each reason should be as concise as possible. For common reasons, try to use the same formatting as previously written reasons to avoid different interpretations. Keep in mind that there's a low character limit forcing you to keep it short.
                    </p>
                    <h5>Decide relevancy of DQs/resets</h5>
                    <p class="mx-2">
                        All events are accounted for in a BN's performance evaluation. Many events resulting from minor or subjective issues aren't important enough to require punishment. "Notability" serves as a way to mark which DQs/resets are applicable for judgment on a BN's evaluations.
                    </p>
                    <p class="mx-2">
                        <span class="vote-pass">Notable</span>: Objective issues, direct violations of the Ranking Criteria
                    </p>
                    <p class="mx-2">
                        <span class="vote-extend">Semi-notable</span>: Major subjective issues whose importance should be judged by evaluators individually
                    </p>
                    <p class="mx-2">
                        <span class="vote-fail">Not notable</span>: Anything else
                    </p>
                    <p class="mx-2">
                        If you're unsure how to mark something, ask another NAT member for their opinion
                    </p>
                    <h5>Keep up to date with this page</h5>
                    <p class="mx-2">
                        It's necessary to track DQ/reset information before reasons become impossible to interpret. A mapper could change the map and involved parties could forget details of the issue. BN evaluations rely on understanding a user's mistakes, so falling behind on data collection will affect future BN evaluations!
                    </p>
                </div>
            </section>
            <section class="segment segment-image mx-0">
                <h2>Disqualifications</h2>
                <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                    <thead>
                        <td scope="col">
                            Date
                        </td>
                        <td scope="col">
                            Mapset
                        </td>
                        <td scope="col">
                            Reason
                        </td>
                        <td scope="col" />
                    </thead>
                    <tbody>
                        <tr
                            v-for="dq in dqs"
                            :key="dq.id"
                        >
                            <td scope="row">
                                {{ new Date(dq.timestamp).toString().slice(4,15) }}
                            </td>
                            <td scope="row">
                                <a :href="dq.postId ? 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/generalAll#/' + dq.postId : 'https://osu.ppy.sh/beatmapsets/' + dq.beatmapsetId + '/discussion/-/events'" target="_blank">
                                    {{ dq.metadata.length > 50 ? dq.metadata.slice(0, 50) + '...' : dq.metadata }}
                                </a>
                            </td>
                            <td scope="row">
                                <span v-if="hasData(dq)" :class="calculateColor(dq)">
                                    ({{ dq.obviousness }}/{{ dq.severity }})
                                </span>
                                {{ dq.content.length > 50 ? dq.content.slice(0, 50) + '...' : dq.content }}
                                <a
                                    href="#"
                                    class="float-right"
                                    data-toggle="modal"
                                    data-target="#editReason"
                                    :data-entry="dq.id"
                                    @click.prevent="selectEntry(dq)"
                                >edit</a>
                            </td>
                            <td scope="row" />
                        </tr>
                    </tbody>
                </table>
            </section>

            <section class="col-md-12 segment segment-image mx-0">
                <h2>Pops</h2>
                <table class="table table-sm table-dark table-hover col-md-12 mt-2">
                    <thead>
                        <td scope="col">
                            Date
                        </td>
                        <td scope="col">
                            Mapset
                        </td>
                        <td scope="col">
                            Reason
                        </td>
                        <td scope="col" />
                    </thead>
                    <tbody>
                        <tr
                            v-for="pop in pops"
                            :key="pop.id"
                        >
                            <td scope="row">
                                {{ new Date(pop.timestamp).toString().slice(4,15) }}
                            </td>
                            <td scope="row">
                                <a :href="pop.postId ? 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/generalAll#/' + pop.postId : 'https://osu.ppy.sh/beatmapsets/' + pop.beatmapsetId + '/discussion/-/events'" target="_blank">
                                    {{ pop.metadata.length > 50 ? pop.metadata.slice(0, 50) + '...' : pop.metadata }}
                                </a>
                            </td>
                            <td scope="row">
                                <span v-if="hasData(pop)" :class="calculateColor(pop)">
                                    ({{ pop.obviousness }}/{{ pop.severity }})
                                </span>
                                {{ pop.content.length > 50 ? pop.content.slice(0, 50) + '...' : pop.content }}
                                <a
                                    href="#"
                                    class="float-right"
                                    data-toggle="modal"
                                    data-target="#editReason"
                                    :data-entry="pop.id"
                                    @click.prevent="selectEntry(pop)"
                                >edit</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </div>

        <data-collection-info
            :selected-entry="selectedEntry"
            @update-content="updateContent($event)"
            @update-obviousness="updateObviousness($event)"
            @update-severity="updateSeverity($event)"
        />
    </div>
</template>

<script>
import postData from '../mixins/postData.js';
import filters from '../mixins/filters.js';
import filterLinks from '../mixins/filterLinks.js';
import DataCollectionInfo from '../components/dataCollection/DataCollectionInfo.vue';

export default {
    name: 'DataCollectionPage',
    components: {
        DataCollectionInfo,
    },
    mixins: [postData, filters, filterLinks],
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            dqs: null,
            pops: null,
            selectedEntry: null,
            info: '',
        };
    },
    watch: {
        allObjs() {
            this.filter();
        },
    },
    created() {
        axios
            .get('/dataCollection/relevantInfo')
            .then(response => {
                this.allObjs = response.data.events;
                this.filterMode = response.data.mode;
                this.hasPagination = false;
                this.hasSeparation = true;
            }).then(function() {
                $('#loading').fadeOut();
                $('#main').attr('style', 'visibility: visible').hide().fadeIn();
            });
    },
    methods: {
        filterBySearchValueContext(o) {
            if (o.metadata.toLowerCase().indexOf(this.filterValue.toLowerCase()) >= 0) {
                return true;
            } else {
                return false;
            }
        },
        separateObjs() {
            this.dqs = this.pageObjs.filter(v => v.eventType == 'Disqualified');
            this.pops = this.pageObjs.filter(v => v.eventType == 'Popped');
        },
        updateContent (event) {
            const i = this.allObjs.findIndex(o => o.id == event.id);
            this.allObjs[i].content = event.value;
            this.selectedEntry = this.allObjs[i];
            this.filter();
        },
        updateObviousness (event) {
            const i = this.allObjs.findIndex(o => o.id == event.id);
            this.allObjs[i].obviousness = event.value;
            this.selectedEntry = this.allObjs[i];
            this.filter();
        },
        updateSeverity (event) {
            const i = this.allObjs.findIndex(o => o.id == event.id);
            this.allObjs[i].severity = event.value;
            this.selectedEntry = this.allObjs[i];
            this.filter();
        },
        selectEntry (entry) {
            this.selectedEntry = entry;
        },
        hasData (event) {
            if ((event.obviousness || event.obviousness == 0) && (event.severity || event.severity == 0)) {
                return true;
            } else {
                return false;
            }
        },
        calculateColor (event) {
            let total = event.obviousness + event.severity;
            if (total >= 4 || event.obviousness == 2 || event.severity == 3) return 'vote-pass';
            else if (total >= 2) return 'vote-extend';
            else return 'vote-fail';
        },
    },
};
</script>

<style>

</style>
