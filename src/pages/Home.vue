<template>
    <div>
        <!-- <bn-finder /> -->
        <bn-finder-matches
            v-if="loggedInUser && loggedInUser.isBnOrNat"
        />
        <mod-score-calculator />

        <section class="card card-body">
            <h4 class="mx-auto mb-3">
                Current Beatmap Nominators
            </h4>

            <transition-group
                appear
                name="route-transition"
                mode="out-in"
                tag="div"
                class="row"
            >
                <table v-for="usersByMode in sorted" :key="usersByMode._id" class="table table-sm table-dark table-hover col-6 col-md-3">
                    <thead>
                        <td>{{ usersByMode._id }}</td>
                    </thead>

                    <tbody>
                        <tr v-for="user in usersByMode.users" :key="user.id">
                            <td
                                style="height: 10px;"
                                :style="getGroupColor(user)"
                            >
                                <div>
                                    <user-link
                                        :osu-id="user.osuId"
                                        :username="user.username"
                                    />
                                    <span v-if="user.requestStatus">
                                        <span
                                            v-for="status in requestMethods(user.requestStatus)"
                                            :key="status"
                                            class="badge badge-pill mx-1 text-lowercase"
                                            :class="status === 'closed' ? 'badge-danger' : status === 'open' ? 'badge-success' : 'badge-primary'"
                                            v-html="$md.renderInline(formatLink(status, user.requestLink))"
                                        />
                                    </span>
                                </div>
                            </td>
                        </tr>
                        <tr v-for="i in modeEmptyCells(usersByMode._id)" :key="i">
                            <td
                                style="height: 10px; opacity: 0;"
                            >
                                <div>
                                    .
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </transition-group>
        </section>

        <a
            id="mgsite"
            class="btn btn-sm btn-primary"
            href="https://mappersguild.com/"
            style="
                position: fixed;
                z-index: 1060;
                bottom: 20px;
                right: 20px;"
        >
            visit Mappers' Guild
        </a>

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import evaluations from '../mixins/evaluations';
import ToastMessages from '../components/ToastMessages.vue';
import ModScoreCalculator from '../components/home/ModScoreCalculator.vue';
import BnFinder from '../components/home/BnFinder.vue';
import BnFinderMatches from '../components/home/BnFinderMatches.vue';
import UserLink from '../components/UserLink.vue';

export default {
    name: 'Index',
    components: {
        ToastMessages,
        ModScoreCalculator,
        BnFinder,
        BnFinderMatches,
        UserLink,
    },
    mixins: [ evaluations ],
    computed: {
        ...mapState([
            'allUsersByMode',
            'loggedInUser',
        ]),
        sorted () {
            const sortOrder = ['osu', 'taiko', 'catch', 'mania'];
            const sorted = [...this.allUsersByMode];

            return sorted.sort(function(a, b) {
                return sortOrder.indexOf(a._id) - sortOrder.indexOf(b._id);
            });
        },
    },
    async created () {
        if (this.allUsersByMode.length) return;

        const data = await this.$http.executeGet('/relevantInfo');

        if (data.allUsersByMode) {
            this.$store.commit('setHomeData', data.allUsersByMode);
        }
    },
    methods: {
        /** @returns {array} */
        requestMethods(requestStatus) {
            let statusList = [...requestStatus];
            statusList = statusList.sort();

            if (statusList.length && !statusList.includes('closed')) {
                statusList.unshift('open');
            }

            return statusList;
        },
        /** @returns {string} */
        getGroupColor (user) {
            if (user.group === 'nat') {
                return 'border-left: 3px solid var(--danger);';
            }

            if (user.level === 'probation') {
                return 'border-left: 3px solid var(--probation);';
            }

            if (user.level === 'full') {
                return 'border-left: 3px solid var(--bn);';
            }
        },
        /** @returns {string} */
        formatLink (status, requestLink) {
            status = this.makeWordFromField(status);

            if (status === 'Personal Queue' && requestLink) {
                return `[${status}](${requestLink})`;
            }

            if (status === 'Global Queue') {
                return `[${status}](/modrequests)`;
            }

            return status;
        },
        /** @returns {number} */
        modeEmptyCells (mode) {
            const osu = this.allUsersByMode.find(i => i._id == 'osu');
            const osuCount = osu.users.length;
            const newMode = this.allUsersByMode.find(i => i._id == mode);
            const modeCount = newMode.users.length;

            return osuCount - modeCount;
        },
    },
};
</script>
