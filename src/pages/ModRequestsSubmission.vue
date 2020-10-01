<template>
    <div class="row">
        <div class="col-sm">
            <section class="card">
                <div class="card-body">
                    <div class="row">
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
                                :disabled="!loggedInUser"
                            >

                            <select
                                v-model="category"
                                class="form-control my-1"
                                :disabled="!loggedInUser"
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
                                :disabled="!loggedInUser"
                            >

                            <button
                                class="btn btn-primary btn-block"
                                :disabled="!loggedInUser"
                                @click="submit($event)"
                            >
                                Submit
                            </button>
                        </div>
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
        </div>

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../mixins/postData.js';
import modRequestsModule from '../store/modRequests';
import RequestsListing from '../components/modRequests/RequestsListing.vue';
import MyRequestRow from '../components/modRequests/MyRequestRow.vue';
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'ModRequestsSubmission',
    components: {
        RequestsListing,
        MyRequestRow,
        ToastMessages,
    },
    mixins: [ postData ],
    data () {
        return {
            link: '',
            category: '',
            comment: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('modRequests', [
            'ownRequests',
        ]),
    },
    beforeCreate () {
        if (!this.$store.hasModule('modRequests')) {
            this.$store.registerModule('modRequests', modRequestsModule);
        }
    },
    async created () {
        if (this.loggedInUser) {
            const data = await this.initialRequest('/modRequests/owned');
            if (!data.error) this.$store.commit('modRequests/setOwnRequests', data);
        }
    },
    methods: {
        async submit (e) {
            if (!this.category || !this.link) {
                this.$store.dispatch('updateToastMessages', {
                    message: 'Missing link or category',
                    type: 'info',
                });

                return;
            }

            if (this.comment && this.comment.length > 300) {
                this.$store.dispatch('updateToastMessages', {
                    message: 'Comment is too long...',
                    type: 'info',
                });

                return;
            }

            await this.executePost('/modRequests/store', {
                link: this.link,
                category: this.category,
                comment: this.comment,
            }, e);

            const data = await this.executeGet('/modRequests/owned');
            if (!data.error) this.$store.commit('modRequests/setOwnRequests', data);
        },
    },
};
</script>
