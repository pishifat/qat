<template>
    <div class="row">
        <div class="col-sm">
            <section class="card card-body">
                <h4 class="mx-auto mb-3">
                    Open Beatmap Nominators
                </h4>
                <p class="mx-auto mb-3 text-center">This is a list of Beatmap Nominators who are currently open for requests. Make sure to pay attention to their request methods and guidelines listed in their userpages!</p>
                <transition-group
                    appear
                    name="route-transition"
                    mode="out-in"
                    tag="div"
                    class="row align-items-start"
                >
                    <table v-for="usersByMode in sortedList" :key="usersByMode._id" class="table table-sm table-dark table-hover col-6 col-md-3">
                        <thead>
                            <td>{{ usersByMode._id == 'osu' ? 'osu!' : 'osu!' + usersByMode._id }}</td>
                        </thead>
                        <tbody>
                            <tr v-for="user in usersByMode.users" :key="user.id"> 
                                <user-card :user="user" />
                            </tr>
                        </tbody>
                    </table>
                </transition-group>
            </section>
            <div class="alert alert-danger mb-2">
                <i class="fas fa-exclamation-triangle"></i>
                The request methods below are rarely used and do not guarantee that your request will receive a response. Please use the table above instead.
            </div>
            <bn-finder />
            <section class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-sm-12">
                            <h4 class="mb-2">Global Queue</h4>
                        </div>
                        <div class="col-sm-12">
                            <p>If you're a mapper, this page lets you submit requests to Beatmap Nominators without asking people individually.</p>
                            <p>If you're a Beatmap Nominator, this page lets you view maps from a variety of creators and select any that you're interested in modding.</p>
                            <p><b>Not every beatmap submitted will be modded.</b></p>
                            <hr>
                            <p>Submission info:</p>
                            <ul>
                                <li>You can submit a new beatmap once every month</li>
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
                    title="Global Queue Requests"
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

        <edit-request-modal />
        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import modRequestsModule from '../store/modRequests';
import RequestsListing from '../components/modRequests/RequestsListing.vue';
import EditRequestModal from '../components/modRequests/EditRequestModal.vue';
import MyRequestRow from '../components/modRequests/MyRequestRow.vue';
import ToastMessages from '../components/ToastMessages.vue';
import BnFinder from '../components/modRequests/BnFinder.vue';
import UserCard from '../components/home/UserCard.vue';

export default {
    name: 'ModRequestsSubmission',
    components: {
        RequestsListing,
        EditRequestModal,
        MyRequestRow,
        ToastMessages,
        BnFinder,
        UserCard,
    },
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
            'allUsersByMode',
        ]),
        ...mapState('modRequests', [
            'ownRequests',
        ]),
        sortedList() {
            const sortOrder = ['osu', 'taiko', 'catch', 'mania'];
            const sorted = [...this.allUsersByMode];

            // filter out users who have "closed" in their requestStatus array
            sorted.forEach((mode) => {
                mode.users = mode.users.filter((user) => {
                    return (!user.requestStatus?.includes('closed') && user.requestStatus?.length);
                });
            });

            return sorted.sort(function(a, b) {
                return sortOrder.indexOf(a._id) - sortOrder.indexOf(b._id);
            });
        },
    },
    beforeCreate () {
        if (!this.$store.hasModule('modRequests')) {
            this.$store.registerModule('modRequests', modRequestsModule);
        }
    },
    async created () {
        if (this.loggedInUser) {
            const data = await this.$http.initialRequest('/modRequests/owned');
            if (!data.error) this.$store.commit('modRequests/setOwnRequests', data);
        }
        if (this.allUsersByMode.length) return;

        const userData = await this.$http.executeGet('/relevantInfo');

        //! FIXME fix the bug where if you go from /modRequests to /home, the bn table will continue to show open users only, instead of all users
        if (userData.allUsersByMode) {
            this.$store.commit('setOpenUsersData', userData.allUsersByMode);
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

            await this.$http.executePost('/modRequests/store', {
                link: this.link,
                category: this.category,
                comment: this.comment,
            }, e);

            const data = await this.$http.executeGet('/modRequests/owned');
            if (!data.error) this.$store.commit('modRequests/setOwnRequests', data);
        },
    },
};
</script>
