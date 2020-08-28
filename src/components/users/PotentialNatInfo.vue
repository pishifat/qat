<template>
    <div class="my-2">
        <button
            v-if="!potentialNatInfo.length"
            class="btn btn-sm btn-primary my-1"
            data-toggle="tooltip"
            data-placement="right"
            title="Finds info on prospective NAT members"
            @click="findPotentialNatInfo()"
        >
            Load potential NAT info
        </button>

        <div v-if="potentialNatInfo.length">
            <div v-for="user in potentialNatInfo" :key="user.osuId" class="small my-2">
                <a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{ user.username }}</a>
                <p class="ml-2">
                    <a data-toggle="collapse" :href="'#evaluations' + user.osuId" @click.prevent>Show app evals ({{ user.evaluatedApps.length }}) <i class="fas fa-angle-down" /></a>
                </p>

                <div :id="'evaluations' + user.osuId" class="collapse ml-4">
                    <div v-for="app in user.evaluatedApps" :key="app.id" class="my-2">
                        <div class="card card-body mb-2">
                            <div>
                                <b>Applicant:</b>
                                <a :href="'https://osu.ppy.sh/users/' + app.user.osuId" target="_blank">
                                    {{ app.user.username }}
                                </a>
                                -- {{ app.deadline | toStandardDate }}
                            </div>
                        </div>

                        <div class="card card-body mb-2">
                            <div class="mb-2">
                                <b>NAT Consensus:</b>
                                <span :class="isPass(app.consensus) ? 'text-success' : 'text-danger'">{{ app.consensus }}</span>
                            </div>

                            <b>Feedback:</b>
                            <div class="pre-line text-secondary ml-2">
                                {{ app.feedback }}
                            </div>
                        </div>

                        <div class="card card-body">
                            <div class="mb-2">
                                <b>BN's opinion:</b>
                                <span :class="findVote(app.reviews, user.osuId) == 'pass' ? 'text-success' : findVote(app.reviews, user.osuId) == 'neutral' ? 'text-neutral' : 'text-danger'">
                                    {{ findVote(app.reviews, user.osuId) }}
                                </span>
                            </div>

                            <div class="mb-2">
                                <b>Behavior comment:</b>
                                <div class="pre-line text-secondary ml-2">
                                    {{ findBehaviorComment(app.reviews, user.osuId) }}
                                </div>
                            </div>

                            <div>
                                <b>Modding comment:</b>

                                <div class="pre-line text-secondary ml-2">
                                    {{ findModdingComment(app.reviews, user.osuId) }}
                                </div>
                            </div>
                        </div>

                        <hr>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import { AppEvaluationConsensus } from '../../../shared/enums';

export default {
    name: 'PotentialNatInfo',
    mixins: [ postData ],
    data() {
        return {
            potentialNatInfo: [],
        };
    },
    computed: {
        /** @returns {Boolean} */
        isPass (consensus) {
            return consensus === AppEvaluationConsensus.Pass;
        },
    },
    methods: {
        async findPotentialNatInfo() {
            const users = await this.executeGet('/users/nat/findPotentialNatInfo/');

            if (users) {
                users.forEach(user => {
                    if (user.evaluatedApps.length) {
                        this.potentialNatInfo.push(user);
                    }
                });
            }
        },
        findVote(reviews, osuId) {
            let vote = 'none';
            reviews.forEach(review => {
                if (review.evaluator.osuId == osuId) {
                    if (review.vote == 1) vote = 'pass';
                    else if (review.vote == 2) vote = 'neutral';
                    else if (review.vote == 3) vote = 'fail';
                }
            });

            return vote;
        },
        findBehaviorComment(reviews, osuId) {
            let behaviorComment = 'none';
            reviews.forEach(review => {
                if (review.evaluator.osuId == osuId) {
                    behaviorComment = review.behaviorComment;
                }
            });

            return behaviorComment;
        },
        findModdingComment(reviews, osuId) {
            let moddingComment = 'none';
            reviews.forEach(review => {
                if (review.evaluator.osuId == osuId) {
                    moddingComment = review.moddingComment;
                }
            });

            return moddingComment;
        },
    },
};
</script>
