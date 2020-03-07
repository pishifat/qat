<template>
    <div class="row">
        <section class="col-md-12 segment mb-4">
            <div class="input-group input-group-sm">
                <input
                    v-model="searchValue"
                    type="text"
                    placeholder="username or osuID..."
                    maxlength="18"
                    autocomplete="off"
                    @keyup.enter="query($event)"
                >
                <button class="btn btn-nat ml-2" type="submit" @click="query($event)">
                    Search archives
                </button>
                <span v-if="info" class="errors ml-4 mt-2">Error: {{ info }}</span>
            </div>
            <div class="input-group input-group-sm my-2">
                <input
                    id="limit"
                    type="text"
                    placeholder="# entries..."
                    maxlength="3"
                    autocomplete="off"
                    @keyup.enter="queryRecent($event)"
                >
                <button class="btn btn-nat ml-2" type="submit" @click="queryRecent($event)">
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
        };
    },
    created() {
        const params = new URLSearchParams(document.location.search.substring(1));

        if (params.get('user') && params.get('user').length) {
            axios
                .get(`/evalArchive/search/${params.get('user')}`)
                .then(response => {
                    if (response.data.error) {
                        this.info = response.data.error;
                    } else {
                        this.evaluator = response.data.evaluator;
                        this.queried = true;
                        this.appEvals = response.data.a;
                        this.bnEvals = response.data.b;
                    }
                })
                .then(function() {
                    $('#loading').fadeOut();
                    $('#main')
                        .attr('style', 'visibility: visible')
                        .hide()
                        .fadeIn();
                });
        } else if (params.get('eval') && params.get('eval').length) {
            axios
                .get(`/evalArchive/searchById/${params.get('eval')}`)
                .then(response => {
                    if (response.data.error) {
                        this.info = response.data.error;
                    } else {
                        this.evaluator = response.data.evaluator;

                        if (response.data.round) {
                            this.queried = true;

                            if (response.data.round.applicant) {
                                this.selectedDiscussApp = response.data.round;
                                this.appEvals.push(response.data.round);
                                $('#applicationArchiveInfo').modal('show');
                            } else {
                                this.selectedDiscussRound = response.data.round;
                                this.bnEvals.push(response.data.round);
                                $('#currentBnArchiveInfo').modal('show');
                            }

                        }

                    }
                })
                .then(function() {
                    $('#loading').fadeOut();
                    $('#main')
                        .attr('style', 'visibility: visible')
                        .hide()
                        .fadeIn();
                });
        } else {
            axios
                .get('/evalArchive/relevantInfo')
                .then(response => {
                    this.evaluator = response.data.evaluator;
                })
                .then(function() {
                    $('#loading').fadeOut();
                    $('#main')
                        .attr('style', 'visibility: visible')
                        .hide()
                        .fadeIn();
                });
        }
    },
    methods: {
        async query(e) {
            this.info = '';
            let user = this.searchValue;

            if (!user || !user.length) {
                this.info = 'Must enter a username or osu ID!';
            } else {
                history.pushState(null, 'Evaluation Archives', `/evalArchive?user=${user}`);
                const result = await this.executeGet('/evalArchive/search/' + user, e);

                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.appEvals = result.a;
                        this.bnEvals = result.b;
                    }
                }
            }
        },
        async queryRecent(e) {
            this.info = '';
            let limit = $('#limit').val();

            if (parseInt(limit)) {
                const result = await this.executeGet('/evalArchive/searchRecent/' + limit, e);

                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.appEvals = result.a;
                        this.bnEvals = result.b;
                    }
                }
            } else {
                this.info = 'Invalid number';
            }
        },
    },
};
</script>