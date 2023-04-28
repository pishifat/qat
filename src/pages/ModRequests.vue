<template>
    <div class="row">
        <div class="col-sm">
            <div class="alert alert-danger mb-2">
                <i class="fas fa-exclamation-triangle"></i>
                This page is no longer used. See <a href="/modrequests">this page</a> for mod requests instead.
            </div>
            <bn-finder-matches />
            <requests-listing
                v-if="involvedRequests.length"
                v-slot="{ request }"
                title="Requests You're Involved In"
                :requests="involvedRequests"
                collapse-target="involvedRequestsCollapse"
            >
                <request-row
                    :request="request"
                />
            </requests-listing>

            <section class="card card-body">
                <div class="row">
                    <div class="col-sm-12">
                        <div
                            v-for="(items, filterType) in possibleFilters"
                            :key="filterType"
                            class="sort-filter"
                        >
                            <div class="sort-filter__title">
                                {{ filterType }}
                            </div>
                            <div class="sort-filter__items">
                                <a
                                    v-for="filter in items"
                                    :key="filter"
                                    class="sort-filter__item"
                                    :class="filters.includes(filter) ? '' : 'sort-filter__item--selected'"
                                    href="#"
                                    @click.prevent="$store.commit('modRequests/updateFilters', filter)"
                                >
                                    <request-tag :class-list="filters.includes(filter) ? 'badge-bright-blue-gray' : 'badge-info'">
                                        {{ filter }}
                                    </request-tag>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <requests-listing
                v-slot="{ request }"
                :requests="filteredRequests"
            >
                <request-row
                    :request="request"
                />
            </requests-listing>

            <button type="button" class="btn btn-primary btn-block mb-2" @click="showMore($event)">
                Show more
            </button>
        </div>

        <request-info />
        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import modRequestsModule from '../store/modRequests';
import RequestsListing from '../components/modRequests/RequestsListing.vue';
import RequestRow from '../components/modRequests/RequestRow.vue';
import RequestInfo from '../components/modRequests/RequestInfo.vue';
import RequestTag from '../components/modRequests/RequestTag.vue';
import ToastMessages from '../components/ToastMessages.vue';
import BnFinderMatches from '../components/modRequests/BnFinderMatches.vue';

export default {
    name: 'ModRequests',
    components: {
        RequestsListing,
        RequestRow,
        RequestInfo,
        RequestTag,
        ToastMessages,
        BnFinderMatches,
    },
    computed: {
        ...mapState('modRequests', [
            'filters',
            'possibleFilters',
            'involvedRequests',
            'monthsLimit',
        ]),
        ...mapGetters('modRequests', [
            'filteredRequests',
        ]),
    },
    beforeCreate () {
        if (!this.$store.hasModule('modRequests')) {
            this.$store.registerModule('modRequests', modRequestsModule);
        }
    },
    async created () {
        const [all, involved] = await Promise.all([
            this.$http.initialRequest('/modRequests/listing/all'),
            this.$http.executeGet('/modRequests/listing/involved'),
        ]);
        if (!all.error) this.$store.commit('modRequests/setAllRequests', all);
        if (!involved.error) this.$store.commit('modRequests/setInvolvedRequests', involved);
    },
    methods: {
        async showMore (e) {
            this.$store.commit('modRequests/increaseLimit');
            const data = await this.$http.executeGet(`/modRequests/listing/all?limit=${this.monthsLimit}`, e);
            if (!data.error) this.$store.commit('modRequests/setAllRequests', data);
        },
    },
};
</script>
