<template>
    <div v-cloak class="container py-4 vh-100" :class="!user || (user && user.isFeatureTester) ? '' : 'align-items-center d-flex justify-content-center'">
        <div
            v-if="isLoading"
            class="loading-container"
        >
            <div
                class="spinner-border"
                role="status"
                style="height: 3rem; width: 3rem;"
            >
                <span class="sr-only">Loading...</span>
            </div>
        </div>

        <div
            class="opacity-transition"
            :class="isLoading ? 'hide' : ''"
        >
            <div class="row">
                <div class="col-sm">
                    <section v-if="!user" class="card card-body">
                        <div class="row">
                            <div class="col-sm-12 text-center">
                                <form action="/login" method="GET" class="mb-3">
                                    <button class="btn btn-lg btn-primary" type="submit">
                                        Authorize your osu! account
                                    </button>
                                </form>

                                "Authorizing" will identify you through your osu! account.
                            </div>
                        </div>
                    </section>

                    <section class="card">
                        <h5 class="card-header">
                            Mod Requests
                        </h5>
                        <div class="card-body row">
                            <div class="col-sm-12">
                                <p>If you're a mapper, this page lets you submit requests to Beatmap Nominators without asking people individually.</p>
                                <p>If you're a Beatmap Nominator, this page lets you view maps from a variety of creators and select any that you're interested in modding.</p>
                                <p><b>Not every beatmap submitted will be modded.</b></p>
                                <hr>
                                <p>Submission info:</p>
                                <ul>
                                    <li>You can submit once every two months</li>
                                    <li>Only submit beatmaps that are ready for ranking</li>
                                    <li>Set your map's language/genre before submitting</li>
                                    <li>
                                        Categorizing isn't 100% accurate, but it can help BNs find what they're interested in. Examples:
                                        <a href="https://osu.ppy.sh/beatmapsets/703956" target="_blank">Simple</a>,
                                        <a href="https://osu.ppy.sh/beatmapsets/694402" target="_blank">Tech</a>,
                                        <a href="https://osu.ppy.sh/beatmapsets/302756" target="_blank">Double BPM</a>,
                                        <a href="https://osu.ppy.sh/beatmapsets/364574" target="_blank">Conceptual</a>
                                    </li>
                                    <li>
                                        If you're mapping a featured artist, consider joining the
                                        <a href="https://mappersguild.com/" target="_blank">Mappers' Guild</a> for some extra rewards!
                                    </li>
                                </ul>

                                <input
                                    v-model="link"
                                    type="text"
                                    class="form-control my-1"
                                    placeholder="Beatmap Link, eg: https://osu.ppy.sh/beatmapsets/703956#osu/1489205"
                                    :disabled="!user"
                                >

                                <select
                                    v-model="category"
                                    class="form-control my-1"
                                    :disabled="!user"
                                >
                                    <option value="" disabled>
                                        Select a category
                                    </option>
                                    <option value="simple">
                                        Simple
                                    </option>
                                    <option value="tech">
                                        Tech
                                    </option>
                                    <option value="doubleBpm">
                                        Double BPM
                                    </option>
                                    <option value="conceptual">
                                        Conceptual
                                    </option>
                                    <option value="other">
                                        Other
                                    </option>
                                </select>

                                <input
                                    v-model.trim="comment"
                                    type="text"
                                    class="form-control my-1"
                                    placeholder="comment... (optional)"
                                    maxlength="500"
                                    :disabled="!user"
                                >

                                <button
                                    :disabled="!user"
                                    class="btn btn-primary btn-block"
                                    @click="submit"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </section>

                    <template v-if="ownRequests.length">
                        <requests-listing
                            title="My Requests"
                            :requests="ownRequests"
                        >
                            <template v-slot="{ request }">
                                <my-request-row :request="request" />
                            </template>

                            <template #footer>
                                <div class="card-footer text-secondary">
                                    Please keep in mind:

                                    <ul class="mb-0">
                                        <li>Comments are quick reference notes, NOT mods. If you want a deeper explanation talk with the involved BN privately.</li>
                                        <li>If your request was denied by someone, other BNs can still accept it. A denial is better than no response! :)</li>
                                    </ul>
                                </div>
                            </template>
                        </requests-listing>
                    </template>

                    <requests-listing
                        v-if="involvedRequests.length"
                        v-slot="{ request }"
                        title="Requests You're Involved In"
                        :requests="involvedRequests"
                    >
                        <request-row
                            :request="request"
                            @update:editing="editing = $event"
                        />
                    </requests-listing>

                    <template v-if="user && user.isFeatureTester">
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
                                                @click.prevent="$store.commit('updateFilters', filter)"
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
                                @update:editing="editing = $event"
                            />
                        </requests-listing>
                    </template>
                </div>
            </div>
        </div>

        <request-info />
    </div>
</template>

<script>
import Axios from 'axios';
import RequestsListing from '../components/modRequests/RequestsListing.vue';
import MyRequestRow from '../components/modRequests/MyRequestRow.vue';
import RequestRow from '../components/modRequests/RequestRow.vue';
import RequestInfo from '../components/modRequests/RequestInfo.vue';
import RequestTag from '../components/modRequests/RequestTag.vue';
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'ModRequests',
    components: {
        RequestsListing,
        MyRequestRow,
        RequestRow,
        RequestInfo,
        RequestTag,
    },
    data () {
        return {
            isLoading: true,
            link: '',
            category: '',
            comment: '',
        };
    },
    computed: {
        ...mapState([
            'ownRequests',
            'user',
            'filters',
            'possibleFilters',
        ]),
        ...mapGetters([
            'involvedRequests',
            'filteredRequests',
        ]),
    },
    async created () {
        await this.$store.dispatch('getData');
        this.isLoading = !this.isLoading;
    },
    methods: {
        async submit () {
            if (!this.category || !this.link) {
                alert('Missing link or category');

                return;
            }

            const { data } = await Axios.post('/modRequests/store', {
                link: this.link,
                category: this.category,
                comment: this.comment,
            });
            alert(data.success || data.error);
            await this.$store.dispatch('getData');
        },
    },
};
</script>

<style scoped>

.loading-container {
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    top: 50vh;
    text-align: center;
    z-index: 1;
}

.hide {
    visibility: hidden;
    opacity: 0;
}

.opacity-transition {
    transition: opacity 0.25s ease-in-out;
}

</style>
