<template>
    <div class="row">
        <section class="col-md-12 segment mb-4">
            <div class="input-group input-group-sm small">
                <input
                    v-model="searchValue"
                    type="text"
                    placeholder="username or osuID..."
                    maxlength="18"
                    autocomplete="off"
                    @keyup.enter="query($event)"
                >
                <button class="btn btn-sm btn-nat ml-2" type="submit" @click="query($event)">
                    Search archives
                </button>
                <span v-if="info" class="errors ml-4 mt-2">Error: {{ info }}</span>
            </div>
            <div class="input-group input-group-sm small my-2">
                <input
                    v-model="limit"
                    type="text"
                    placeholder="# entries..."
                    maxlength="3"
                    autocomplete="off"
                    @keyup.enter="queryRecent($event)"
                >
                <button class="btn btn-sm btn-nat ml-2" type="submit" @click="queryRecent($event)">
                    Show recent
                </button>
            </div>
        </section>
        <section v-if="queried" class="col-md-12 segment segment-image">
            <h2>Application Evaluations</h2>

            <div v-if="appEvals.length">
                <transition-group name="list" tag="div" class="row">
                    <application-discussion-card
                        v-for="application in appEvals"
                        :key="application.id"
                        :application="application"
                        :evaluator="evaluator"
                        :mode="application.mode"
                        :is-archive="true"
                        @update:selected-application="selectedDiscussApp = $event"
                    />
                </transition-group>
            </div>
            <p v-else class="ml-4">
                None...
            </p>
        </section>
        <section v-if="queried" class="col-md-12 segment segment-image">
            <h2>BN Evaluations</h2>

            <div v-if="bnEvals.length">
                <transition-group name="list" tag="div" class="row">
                    <current-bn-discussion-card
                        v-for="evalRound in bnEvals"
                        :key="evalRound.id"
                        :eval-round="evalRound"
                        :evaluator="evaluator"
                        :is-archive="true"
                        @update:selected-discuss-round="selectedDiscussRound = $event"
                    />
                </transition-group>
            </div>
            <p v-else class="ml-4">
                None...
            </p>
        </section>

        <application-archive-info
            :application="selectedDiscussApp"
            :evaluator="evaluator"
            @update-application="updateApplication($event)"
        />

        <current-bn-archive-info
            :eval-round="selectedDiscussRound"
            :evaluator="evaluator"
            @update-eval-round="updateEvalRound($event)"
        />
    </div>
</template>



<script>
import ApplicationDiscussionCard from '../components/evaluations/applications/ApplicationDiscussionCard.vue';
import CurrentBnDiscussionCard from '../components/evaluations/currentBnEvaluations/CurrentBnDiscussionCard.vue';
import ApplicationArchiveInfo from '../components/evaluations/applications/ApplicationArchiveInfo.vue';
import CurrentBnArchiveInfo from '../components/evaluations/currentBnEvaluations/CurrentBnArchiveInfo.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'EvalArchivePage',
    components: {
        ApplicationDiscussionCard,
        CurrentBnDiscussionCard,
        ApplicationArchiveInfo,
        CurrentBnArchiveInfo,
    },
    mixins: [postData],
    data() {
        return {
            appEvals: [],
            selectedDiscussApp: null,
            bnEvals: [],
            selectedDiscussRound: null,
            queried: false,
            info: '',
            evaluator: null,
            searchValue: null,
            limit: null,
        };
    },
    async created() {
        const params = new URLSearchParams(document.location.search.substring(1));

        if (params.get('user') && params.get('user').length) {
            const res = await this.executeGet(`/evalArchive/search/${params.get('user')}`);

            if (res) {
                this.evaluator = res.evaluator;
                this.queried = true;
                this.appEvals = res.bnApplications;
                this.bnEvals = res.evalRounds;
            }
        } else if (params.get('eval') && params.get('eval').length) {
            const res = await this.executeGet(`/evalArchive/searchById/${params.get('eval')}`);

            if (res) {
                this.evaluator = res.evaluator;

                if (res.round) {
                    this.queried = true;

                    if (res.round.applicant) {
                        this.selectedDiscussApp = res.round;
                        this.appEvals.push(res.round);
                        $('#applicationArchiveInfo').modal('show');
                    } else {
                        this.selectedDiscussRound = res.round;
                        this.bnEvals.push(res.round);
                        $('#currentBnArchiveInfo').modal('show');
                    }
                }
            }
        } else {
            const res = await this.executeGet('/evalArchive/relevantInfo');

            if (res) {
                this.evaluator = res.evaluator;
            }
        }

        $('#loading').fadeOut();
        $('#main')
            .attr('style', 'visibility: visible')
            .hide()
            .fadeIn();
    },
    methods: {
        async query(e) {
            this.info = '';

            if (!this.searchValue || !this.searchValue.length) {
                this.info = 'Must enter a username or osu ID!';
            } else {
                history.pushState(null, 'Evaluation Archives', `/evalArchive?user=${this.searchValue}`);
                const result = await this.executeGet('/evalArchive/search/' + this.searchValue, e);

                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.appEvals = result.bnApplications;
                        this.bnEvals = result.evalRounds;
                    }
                }
            }
        },
        async queryRecent(e) {
            this.info = '';

            if (parseInt(this.limit)) {
                const result = await this.executeGet('/evalArchive/searchRecent/' + this.limit, e);

                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.appEvals = result.bnApplications;
                        this.bnEvals = result.evalRounds;
                    }
                }
            } else {
                this.info = 'Invalid number';
            }
        },
    },
};
</script>