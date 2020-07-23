<template>
    <div v-cloak class="container py-4 vh-100" :class="user && user.isFeatureTester ? '' : 'align-items-center d-flex justify-content-center'">
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

                    <section class="card card-body">
                        <div class="row">
                            <div class="col-sm-12">
                                <h5>Mod Requests</h5>
                                <p>If you're a mapper, this page lets you submit requests to Beatmap Nominators without asking people individually.</p>
                                <p>If you're a Beatmap Nominator, this page lets you view maps from a variety of creators and select any that you're interested in modding.</p>
                                <p><b>Not every beatmap submitted will be modded.</b></p>
                                <hr>
                                <p>Submission info:</p>
                                <ul>
                                    <li>You can submit once per month</li>
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
                                    maxlength="300"
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

                    <requests-listing
                        v-if="ownRequests.length"
                        v-slot="{ request }"
                        title="My Requests"
                        :requests="ownRequests"
                    >
                        <my-request-row :request="request" />
                    </requests-listing>

                    <requests-listing
                        v-if="user && user.isFeatureTester"
                        v-slot="{ request }"
                        :requests="requests"
                    >
                        <request-row
                            :request="request"
                            @update:editing="editing = $event"
                        />
                    </requests-listing>
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
import { mapState } from 'vuex';

export default {
    name: 'ModRequests',
    components: {
        RequestsListing,
        MyRequestRow,
        RequestRow,
        RequestInfo,
    },
    data () {
        return {
            isLoading: true,
            link: '',
            category: '',
            comment: '',
        };
    },
    computed: mapState([
        'ownRequests',
        'requests',
        'user',
    ]),
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
