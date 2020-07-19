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
                                        Even though categorizing a map isn't something worth doing, it helps me to quickly know what i'll be looking at. Examples:
                                        <a href="https://osu.ppy.sh/beatmapsets/406467" target="_blank">simple</a>,
                                        <a href="https://osu.ppy.sh/beatmapsets/705788" target="_blank">tech</a>,
                                        <a href="https://osu.ppy.sh/beatmapsets/703956" target="_blank">flow</a>,
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
                                </div>
                                <div class="col-sm-2 d-flex justify-content-around align-items-center pr-2">
                                    <div>{{ request.createdAt | toMonthDay }}</div>
                                    <div :class="getStatusClass(request.status)">
                                        {{ getStatus(request.status) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        v-if="user && user.osuId === 1052994"
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
                                </div>
                                <div class="col-sm-2 d-flex justify-content-around align-items-center pr-2">
                                    {{ request.createdAt | toMonthDay }}
                                    <a
                                        href="#"
                                        @click.prevent="setStatus(request.id, 'denied')"
                                    >
                                        <i class="fas fa-times" :class="request.status === 'denied' ? 'text-danger' : ''" />
                                    </a>
                                    <a
                                        href="#"
                                        @click.prevent="setStatus(request.id, 'accepted')"
                                    >
                                        <i class="fas fa-check" :class="request.status === 'accepted' ? 'text-success' : ''" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Axios from 'axios';

export default {
    name: 'ModRequests',
    data () {
        return {
            isLoading: true,
            ownRequests: [],
            requests: [],
            link: '',
            category: '',
            comment: '',
            user: null,
        };
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
        async setStatus (id, status) {
            const { data } = await Axios.post(`/modRequests/${id}/update`, {
                status,
            });
            alert(data.success || data.error);
            await this.getData();
        },
        getStatus (status) {
            if (status === 'denied') return 'Not accepted';
            if (status === 'accepted') return 'Accepted';

            return 'Pending';
        },
        getStatusClass (status) {
            if (status === 'denied') return 'text-danger';
            if (status === 'accepted') return 'text-success';

            return '';
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
