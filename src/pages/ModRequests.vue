<template>
    <div v-cloak class="align-items-center container d-flex py-4 vh-100">
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
                                <ul>
                                    <li>You can submit once every month</li>
                                    <li>
                                        Even though categorizing a map isn't something right or worth doing, it helps to quickly know what your map may look like. Examples:
                                        <a href="https://osu.ppy.sh/beatmapsets/703956" target="_blank">simple</a>,
                                        <a href="https://osu.ppy.sh/beatmapsets/705788" target="_blank">tech</a>,
                                        <a href="https://osu.ppy.sh/beatmapsets/414289" target="_blank">double bpm</a>,
                                        <a href="https://osu.ppy.sh/beatmapsets/604486" target="_blank">conceptual</a>
                                    </li>
                                    <li>
                                        If you're mapping a featured artist, consider joining the
                                        <a href="https://mappersguild.com/" target="_blank">mappers' guild</a> for some extra rewards!
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
                                class="row no-gutters rounded"
                                style="position: relative; min-height: 40px"
                            >
                                <div
                                    :style="`background-image: url('https://assets.ppy.sh/beatmaps/${request.beatmapset.osuId}/covers/cover.jpg'; position: absolute; `"
                                    style="width: 100%; height: 100%; opacity: 0.2; background-size: cover;"
                                    class="rounded"
                                />
                                <div class="col-sm-10 d-flex align-items-center pl-2">
                                    <a :href="`https://osu.ppy.sh/beatmapsets/${request.beatmapset.osuId}`" target="_blank">
                                        {{ request.beatmapset.title }} -
                                        {{ request.beatmapset.artist }}
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
                                class="row no-gutters rounded"
                                style="position: relative"
                            >
                                <div
                                    :style="`background-image: url('https://assets.ppy.sh/beatmaps/${request.beatmapset.osuId}/covers/cover.jpg'; position: absolute; `"
                                    style="width: 100%; height: 100%; opacity: 0.2; background-size: cover;"
                                    class="rounded"
                                />
                                <div class="col-sm-10">
                                    <img class="rounded-left mr-2" style="width: 40px; height: 40px;" :src="`https://a.ppy.sh/${request.user.osuId}`">
                                    <a :href="`https://osu.ppy.sh/beatmapsets/${request.beatmapset.osuId}`" target="_blank">
                                        {{ request.beatmapset.title }} -
                                        {{ request.beatmapset.artist }}
                                    </a>
                                    (by <a :href="`https://osu.ppy.sh/users/${request.user.osuId}`" target="_blank">
                                        {{ request.user.username }}
                                    </a>)
                                    <span
                                        v-if="request.user.rankedBeatmapsets > 5"
                                        class="badge badge-pill badge-primary"
                                    >
                                        experienced ({{ request.user.rankedBeatmapsets }})
                                    </span>
                                    <span class="badge badge-pill badge-primary">
                                        {{ getTotalLength(request.beatmapset) > 600 ? 'long' : 'short' }} ({{ (request.beatmapset.length / 60).toFixed(1) }} min | {{ (getTotalLength(request.beatmapset) / 60).toFixed(1) }} min)
                                    </span>
                                    <span class="badge badge-pill badge-primary">
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
                                            class="fas fa-ellipsis-v"
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
                        <div class="custom-control custom-radio">
                            <input
                                id="denied"
                                v-model="reviewAction"
                                value="denied"
                                type="radio"
                                class="custom-control-input"
                            >
                            <label class="custom-control-label" for="denied">Denied</label>
                        </div>
                        <div class="custom-control custom-radio">
                            <input
                                id="accepted"
                                v-model="reviewAction"
                                value="accepted"
                                type="radio"
                                class="custom-control-input"
                            >
                            <label class="custom-control-label" for="accepted">Accepted</label>
                        </div>
                        <button class="btn btn-primary" @click="submitReview($event)">
                            Save
                        </button>
                    </div>
                </div>

                <hr>

                <b>Reviews:</b>
                <div v-for="review in selectedRequest.reviews" :key="review.id" class="row text-secondary my-2">
                    <div class="col-sm-3">
                        {{ review.action }}
                    </div>
                    <div class="col-sm-9">
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
