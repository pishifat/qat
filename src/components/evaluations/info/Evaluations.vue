<template>
    <div class="text-shadow mt-3">
        <div v-for="evaluation in natEvaluations" :key="evaluation.id" class="row border-bottom border-dark my-2">
            <div class="col-sm-2">
                <a
                    v-if="isNat"
                    :href="'https://osu.ppy.sh/users/' + evaluation.evaluator.osuId"
                    class="small d-flex flex-column ml-auto font-weight-bold text-center"
                    :class="voteColor(evaluation.vote)"
                >
                    <img :src="'https://a.ppy.sh/' + evaluation.evaluator.osuId" class="card-avatar-img mx-auto">
                    {{ evaluation.evaluator.username }}
                </a>
                <span v-else class="small d-flex flex-column ml-auto font-weight-bold text-center" :class="voteColor(evaluation.vote)">NAT</span>
            </div>
            <div class="col-sm-7">
                <p class="min-spacing">
                    Modding:
                </p>
                <pre class="secondary-text pre-font small ml-2" v-html="filterLinks(evaluation.moddingComment)" />
            </div>
            <div class="col-sm-3">
                <p class="min-spacing">
                    Behavior:
                </p>
                <pre class="secondary-text pre-font small ml-2" v-html="filterLinks(evaluation.behaviorComment)" />
            </div>
        </div>
        <div v-for="evaluation in bnEvaluations" :key="evaluation.id" class="row border-bottom border-dark my-2">
            <div class="col-sm-2">
                <a
                    v-if="isNat"
                    :href="'https://osu.ppy.sh/users/' + evaluation.evaluator.osuId"
                    class="small d-flex flex-column ml-auto font-weight-bold text-center"
                    :class="voteColor(evaluation.vote)"
                >
                    <img :src="'https://a.ppy.sh/' + evaluation.evaluator.osuId" class="card-avatar-img mx-auto">
                    {{ evaluation.evaluator.username }}
                </a>
                <span v-else class="small d-flex flex-column ml-auto font-weight-bold text-center" :class="voteColor(evaluation.vote)">BN</span>
            </div>
            <div class="col-sm-7">
                <p class="min-spacing">
                    Modding:
                </p>
                <pre class="secondary-text pre-font small ml-2" v-html="filterLinks(evaluation.moddingComment)" />
            </div>
            <div class="col-sm-3">
                <p class="min-spacing">
                    Behavior:
                </p>
                <pre class="secondary-text pre-font small ml-2" v-html="filterLinks(evaluation.behaviorComment)" />
            </div>
        </div>
    </div>
</template>

<script>
import filterLinks from '../../../mixins/filterLinks.js';

export default {
    name: 'Evaluations',
    mixins: [ filterLinks ],
    props: {
        evaluations: Array,
        consensus: String,
        isNat: Boolean,
    },
    computed: {
        bnEvaluations() {
            let e = [];
            this.evaluations.forEach(evaluation => {
                if (this.isNat) {
                    if (evaluation.evaluator.isBn || evaluation.evaluator.group == 'user') e.push(evaluation);
                } else {
                    let consensusVote;
                    if (this.consensus == 'pass') consensusVote = 1;
                    if (this.consensus == 'fail') consensusVote = 3;
                    if (evaluation.evaluator.isBn && (evaluation.vote == consensusVote || evaluation.vote == 2)) e.push(evaluation);
                }
            });

            return e;
        },
        natEvaluations() {
            let e = [];
            this.evaluations.forEach(evaluation => {
                if (this.isNat) {
                    if (evaluation.evaluator.isNat) e.push(evaluation);
                } else {
                    let consensusVote;
                    if (this.consensus == 'pass') consensusVote = 1;
                    if (this.consensus == 'fail') consensusVote = 3;
                    if (evaluation.evaluator.isNat && (evaluation.vote == consensusVote || evaluation.vote == 2)) e.push(evaluation);
                }
            });

            return e;
        },
    },
    methods: {
        voteColor(vote) {
            if (vote == 1) {
                return 'vote-pass';
            } else if (vote == 2) {
                return 'vote-neutral';
            } else if (vote == 3) {
                return 'vote-fail';
            }
        },
    },
};
</script>

<style>
.card-avatar-img {
    max-width: 48px;
    max-height: 48px;
    object-fit: cover;
    border-radius: 100%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25);
}
</style>