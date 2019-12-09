<template>
    <div class="text-shadow mt-3">
        <div v-for="evaluation in natEvaluations" :key="evaluation.id" class="row border-bottom border-dark my-2">
            <div class="col-sm-2 d-flex flex-column ml-auto text-center">
                <img :src="'https://a.ppy.sh/' + evaluation.evaluator.osuId" class="card-avatar-img mx-auto">
                <span class="small" :class="voteColor(evaluation.vote)">
                    {{ evaluation.evaluator.username }}
                </span> 
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
            <div class="col-sm-2 d-flex flex-column ml-auto text-center">
                <img :src="'https://a.ppy.sh/' + evaluation.evaluator.osuId" class="card-avatar-img mx-auto">
                <span class="small" :class="voteColor(evaluation.vote)">
                    {{ evaluation.evaluator.username }}
                </span> 
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
    name: 'evaluations',
    props: {
        evaluations: Array,
    },
    mixins: [ filterLinks ],
    computed: {
        bnEvaluations() {
            let e = [];
            this.evaluations.forEach(evaluation => {
                if(evaluation.evaluator.isBn) e.push(evaluation);
            });
            return e;
        },
        natEvaluations() {
            let e = [];
            this.evaluations.forEach(evaluation => {
                if(evaluation.evaluator.isNat) e.push(evaluation);
            });
            return e;
        },
    },
    methods: {
        voteColor(vote) {
            if(vote == 1){
                return 'vote-pass';
            }else if(vote == 2){
                return 'vote-neutral';
            }else if(vote == 3){
                return 'vote-fail';
            }
        }
    }
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