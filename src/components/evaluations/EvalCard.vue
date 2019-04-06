<template>
<div class='col-lg-2 col-md-3 col-sm-6 my-2' @click="application ? selectApplication() : selectEvalRound()" >
    <div class="card custom-bg-dark border-outline" 
    :class="[isSelected ? 'selected-card' : '', 'border-' + findRelevantEval()]" style="height: 100%;" 
    data-toggle='modal' data-target='#evaluationInfo' :data-user="application ? application.id : evalRound.id">
        <div class='card-body eval-card-spacing mx-1'>
            <p v-if="application" class='card-text text-shadow'>
                <a @click.stop :href="'https://osu.ppy.sh/users/' + application.applicant.osuId" target="_blank">{{application.applicant.username}}</a> 
                <i v-if="application.mode == 'osu'" class="far fa-circle"></i>
                <i v-else-if="application.mode == 'taiko'" class="fas fa-drum"></i>
                <i v-else-if="application.mode == 'catch'" class="fas fa-apple-alt"></i>
                <i v-else-if="application.mode == 'mania'" class="fas fa-stream"></i>
            </p>
            <p v-else class='card-text text-shadow'>
                <a @click.stop :href="'https://osu.ppy.sh/users/' + evalRound.bn.osuId" target="_blank">{{evalRound.bn.username}}</a> 
                <i v-if="evalRound.mode == 'osu'" class="far fa-circle"></i>
                <i v-else-if="evalRound.mode == 'taiko'" class="fas fa-drum"></i>
                <i v-else-if="evalRound.mode == 'catch'" class="fas fa-apple-alt"></i>
                <i v-else-if="evalRound.mode == 'mania'" class="fas fa-stream"></i>
            </p>
        </div>
        <div class="card-footer eval-card-spacing mx-2 small">
            <p class='card-text text-shadow'>
                Deadline: 
                <span v-if="application" class="errors">
                    {{createDeadline(application.createdAt)}}
                    <input @click.stop="checkSelection()" class="form-check-input bottom-right-checkbox" 
                    :id="application.id + '-check'" type="checkbox" name="evalTypeCheck" :value="application.id">
                </span>
                <span v-else class="errors">
                    {{new Date(evalRound.deadline).toString().slice(4,10)}}
                    <input @click.stop="checkSelection()" class="form-check-input bottom-right-checkbox"
                    :id="evalRound.id + '-check'" type="checkbox" name="evalTypeCheck" :value="evalRound.id">
                </span>
                
            </p>
            
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'eval-card',
    props: ['application', 'evalRound', 'evaluator', 'all-checked'],
    watch: {
        allChecked: function() {
            this.checkSelection();
        }
    },
    methods: {
        selectApplication: function () {
            this.$emit('update:selectedApplication', this.application);
        },
        selectEvalRound: function () {
            this.$emit('update:selectedEvalRound', this.evalRound);
        },
        findRelevantEval: function(){
            let vote;
            if(this.application){
                this.application.evaluations.forEach(ev => {
                    if(ev.evaluator.id == this.evaluator){
                        if(ev.vote == 1){
                            vote = 'pass';
                        }else if(ev.vote == 2){
                            vote = 'neutral'
                        }else{
                            vote = 'fail'
                        }
                    }
                });
                return vote;
            }else{
                this.evalRound.evaluations.forEach(ev => {
                    if(ev.evaluator.id == this.evaluator){
                        if(ev.vote == 1){
                            vote = 'pass';
                        }else if(ev.vote == 2){
                            vote = 'extend'
                        }else{
                            vote = 'fail'
                        }
                    }
                });
                return vote;
            }
        },
        createDeadline: function(date){
            date = new Date(date);
            date = new Date(date.setDate (date.getDate() + 7)).toString().slice(4,10);
            return date;
        },
        checkSelection: function() {
            if (this.application && $(`#${this.application.id}-check`).is(':checked')) {
                this.isSelected = true;
            }else if (this.evalRound && $(`#${this.evalRound.id}-check`).is(':checked')) {
                this.isSelected = true;
            }else{
                this.isSelected = false;
            }
        }
    },
    data() {
        return {
            isSelected: false,
        };
    },
}
</script>

<style>

    .bottom-right-checkbox{
        position:absolute;
        bottom:0.66rem;
        right:0.66rem;
    }

</style>
