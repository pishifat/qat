<template>
    <div v-cloak class="container py-4 vh-100" :class="user && user.isFeatureTester ? '' : 'align-items-center d-flex'">
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

                    <section
                        v-if="ownRequests.length"
                        class="card"
                    >
                        <h5 class="card-header">
                            My Requests
                        </h5>
                        <div class="card-body">
                            <div
                                v-for="request in ownRequests"
                                :key="request.id"
                                class="row no-gutters rounded my-1"
                                style="position: relative; min-height: 40px"
                            >
                                <div
                                    :style="`background-image: url('https://assets.ppy.sh/beatmaps/${request.beatmapset.osuId}/covers/cover.jpg'; position: absolute; `"
                                    style="width: 100%; height: 100%; opacity: 0.2; background-size: cover;"
                                    class="rounded"
                                />
                                <div class="col-sm-10 d-flex align-items-center pl-2">
                                    <a :href="`https://osu.ppy.sh/beatmapsets/${request.beatmapset.osuId}`" target="_blank">
                                        {{ request.beatmapset.artist }} -
                                        {{ request.beatmapset.title }}
                                    </a>
                                </div>
                                <div class="col-sm-2 d-flex justify-content-around align-items-center pr-2">
                                    <div>{{ request.createdAt | toMonthDay }}</div>
                                    <div :class="getStatusClass(request.reviews)">
                                        {{ getStatus(request.reviews) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        v-if="user && user.isFeatureTester"
                        class="card"
                    >
                        <h5 class="card-header">
                            Requests
                        </h5>
                        <div class="card-body">
                            <div
                                v-for="request in requests"
                                :key="request.id"
                                class="row no-gutters rounded my-1"
                                style="position: relative"
                            >
                                <div
                                    :style="`background-image: url('https://assets.ppy.sh/beatmaps/${request.beatmapset.osuId}/covers/cover.jpg'; position: absolute; `"
                                    style="width: 100%; height: 100%; opacity: 0.2; background-size: cover;"
                                    class="rounded"
                                />
                                <div class="col-sm-1 d-md-block d-none">
                                    <img class="rounded-left mr-2" style="width: 48px; height: 48px;" :src="`https://a.ppy.sh/${request.user.osuId}`">
                                </div>
                                <div class="col-sm-3">
                                    <div class="text-truncate">
                                        <a :href="`https://osu.ppy.sh/beatmapsets/${request.beatmapset.osuId}`" target="_blank">
                                            {{ request.beatmapset.title }} -
                                            {{ request.beatmapset.artist }}
                                        </a>
                                    </div>
                                    <div class="text-truncate">
                                        by <a :href="`https://osu.ppy.sh/users/${request.user.osuId}`" target="_blank">
                                            {{ request.user.username }}
                                        </a>
                                    </div>
                                </div>
                                <div class="col-sm-6 d-flex align-items-center flex-wrap">
                                    <span
                                        v-if="request.user.rankedBeatmapsets > 5"
                                        class="badge badge-pill badge-primary"
                                    >
                                        Ranked ({{ request.user.rankedBeatmapsets }})
                                    </span>
                                    <span class="badge badge-pill badge-primary">
                                        {{ getTotalLength(request.beatmapset) > 600 ? 'Long' : 'Short' }} ({{ (request.beatmapset.length / 60).toFixed(1) }} min | {{ (getTotalLength(request.beatmapset) / 60).toFixed(1) }} min)
                                    </span>
                                    <span class="badge badge-pill badge-primary text-capitalize">
                                        {{ request.category }}
                                    </span>
                                    <span class="badge badge-pill badge-primary">
                                        {{ request.beatmapset.genre }} / {{ request.beatmapset.language }}
                                    </span>
                                    <span
                                        v-if="request.reviews.length > 0"
                                        class="badge badge-pill badge-success"
                                    >
                                        reviewed ({{ request.reviews.length }})
                                    </span>
                                    <span
                                        v-else
                                        class="badge badge-pill badge-danger"
                                    >
                                        not reviewed
                                    </span>
                                </div>
                                <div class="col-sm-2 d-flex justify-content-around align-items-center pr-2">
                                    {{ request.createdAt | toMonthDay }}
                                    <a
                                        href="#"
                                        data-toggle="modal"
                                        data-target="#modRequestDetail"
                                        @click.prevent="editing = request.id"
                                    >
                                        <i
                                            class="fas fa-ellipsis-v px-3"
                                        />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>

        <modal-dialog
            id="modRequestDetail"
            :title="`${selectedRequest && selectedRequest.beatmapset.title} - ${selectedRequest && selectedRequest.beatmapset.artist}`"
        >
            <div v-if="selectedRequest" class="container">
                <div class="row">
                    <div class="col-sm-7">
                        <input
                            v-model.trim="reviewComment"
                            type="text"
                            class="form-control"
                            placeholder="comment (optional)"
                        >
                    </div>
                    <div class="col-sm-5 form-inline justify-content-around">
                        <div class="form-check">
                            <input
                                id="denied"
                                v-model="reviewAction"
                                value="denied"
                                type="radio"
                                class="form-check-input"
                            >
                            <label class="form-check-label" for="denied">Denied</label>
                        </div>
                        <div class="form-check">
                            <input
                                id="accepted"
                                v-model="reviewAction"
                                value="accepted"
                                type="radio"
                                class="form-check-input"
                            >
                            <label class="form-check-label" for="accepted">Accepted</label>
                        </div>
                        <button class="btn btn-primary" @click="submitReview($event)">
                            Save
                        </button>
                    </div>
                </div>

                <template v-if="selectedRequest.comment">
                    <hr>

                    <div class="row mb-2">
                        <div class="col-sm-12">
                            <b>Mapper' comment:</b>
                            {{ selectedRequest.comment }}
                        </div>
                    </div>
                </template>

                <hr>

                <b>Reviews:</b>
                <div v-for="review in selectedRequest.reviews" :key="review.id" class="row text-secondary my-2">
                    <div class="col-sm-2">
                        {{ review.action }}
                    </div>
                    <div class="col-sm-10">
                        {{ review.comment }}
                    </div>
                </div>
            </div>
        </modal-dialog>
    </div>
</template>

<script>
import Axios from 'axios';
import ModalDialog from '../components/ModalDialog.vue';

export default {
    name: 'ModRequests',
    components: {
        ModalDialog,
    },
    data () {
        return {
            isLoading: true,
            ownRequests: [],
            requests: [],
            link: '',
            category: '',
            comment: '',
            user: null,
            editing: null,
            selectedRequest: null,
            reviewAction: '',
            reviewComment: '',
        };
    },
    watch: {
        editing (id) {
            this.selectedRequest = this.requests.find(r => r.id == id);

            if (this.selectedRequest) {
                const userReview = this.selectedRequest.reviews.find(r => r.user.id == this.user.id);
                this.reviewAction = (userReview && userReview.action) || '';
                this.reviewComment = (userReview && userReview.comment) || '';
            }
        },
    },
    async created () {
        await this.getData();
        this.isLoading = !this.isLoading;
    },
    methods: {
        async getData () {
            const { data } = await Axios.get('/modRequests/relevantInfo');

            if (!data.error) {
                this.ownRequests = data.ownRequests;
                this.user = data.user;
                this.requests = data.requests;
            }
        },
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
            await this.getData();
        },
        async submitReview () {
            const { data } = await Axios.post(`/modRequests/${this.editing}/review`, {
                action: this.reviewAction,
                comment: this.reviewComment,
            });
            alert(data.success || data.error);
            await this.getData();

            const i = this.requests.findIndex(r => r.id == this.selectedRequest.id);
            if (i !== -1) this.selectedRequest = this.requests[i];
        },
        getStatus (reviews) {
            if (reviews.find(r => r.action === 'accepted')) return 'Accepted';
            if (reviews.find(r => r.action === 'denied')) return 'Not Accepted';

            return 'Pending';
        },
        getStatusClass (reviews) {
            if (reviews.find(r => r.action === 'accepted')) return 'text-success';
            if (reviews.find(r => r.action === 'denied')) return 'text-danger';

            return '';
        },
        getTotalLength (beatmapset) {
            return beatmapset.numberDiffs * beatmapset.length;
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
