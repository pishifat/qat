<template>
    <div class="my-2">
        <button
            v-if="!potentialNatInfo.length"
            class="btn btn-sm btn-nat minw-200 my-1"
            data-toggle="tooltip"
            data-placement="right"
            title="Finds info on prospective NAT members"
            @click="findPotentialNatInfo()"
        >
            Load potential NAT info
        </button>
        <div v-if="potentialNatInfo.length">
            <div v-for="user in potentialNatInfo" :key="user.osuId" class="small min-spacing my-2">
                <a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{ user.username }}</a>
                <p class="ml-2 min-spacing">
                    <a data-toggle="collapse" :href="'#evaluations' + user.osuId" @click.prevent>Show app evals ({{ user.evaluatedApps.length }}) <i class="fas fa-angle-down" /></a>
                </p>
                <div :id="'evaluations' + user.osuId" class="collapse ml-4">
                    <div v-for="app in user.evaluatedApps" :key="app.id">
                        <p class="min-spacing">
                            Applicant: <a :href="'https://osu.ppy.sh/users/' + app.applicant.osuId" target="_blank">{{ app.applicant.username }}</a> -- {{ app.createdAt.slice(0,10) }}
                        </p>
                        <p class="min-spacing">
                            Consensus: <span :class="app.consensus == 'pass' ? 'vote-pass' : 'vote-fail'">{{ app.consensus }}</span>
                        </p>
                        <p class="min-spacing mb-1">
                            NAT Feedback: <i>{{ app.feedback }}</i>
                        </p>
                        <p class="min-spacing">
                            BN's opinion:<span :class="findVote(app.evaluations, user.osuId) == 'pass' ? 'vote-pass' : findVote(app.evaluations, user.osuId) == 'neutral' ? 'vote-neutral' : 'vote-fail'">
                                {{ findVote(app.evaluations, user.osuId) }}
                            </span>
                        </p>
                        <p class="ml-3 min-spacing">
                            Behavior comment: <i>{{ findBehaviorComment(app.evaluations, user.osuId) }}</i>
                        </p>
                        <p class="ml-3 min-spacing">
                            Modding comment: <i>{{ findModdingComment(app.evaluations, user.osuId) }}</i>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'PotentialNatInfo',
    mixins: [ postData ],
    data() {
        return {
            potentialNatInfo: [],
        };
    },
    methods: {
        async findPotentialNatInfo() {
            const users = await this.executeGet('/users/findPotentialNatInfo/');

            if (users) {
                users.forEach(user => {
                    if (user.evaluatedApps.length) {
                        this.potentialNatInfo.push(user);
                    }
                });
            }
        },
        findVote(evaluations, osuId) {
            let vote = 'none';
            evaluations.forEach(evaluation => {
                if (evaluation.evaluator.osuId == osuId) {
                    if (evaluation.vote == 1) vote = 'pass';
                    else if (evaluation.vote == 2) vote = 'neutral';
                    else if (evaluation.vote == 3) vote = 'fail';
                }
            });

            return vote;
        },
        findBehaviorComment(evaluations, osuId) {
            let behaviorComment = 'none';
            evaluations.forEach(evaluation => {
                if (evaluation.evaluator.osuId == osuId) {
                    behaviorComment = evaluation.behaviorComment;
                }
            });

            return behaviorComment;
        },
        findModdingComment(evaluations, osuId) {
            let moddingComment = 'none';
            evaluations.forEach(evaluation => {
                if (evaluation.evaluator.osuId == osuId) {
                    moddingComment = evaluation.moddingComment;
                }
            });

            return moddingComment;
        },
    },
};
</script>

<style>

</style>
