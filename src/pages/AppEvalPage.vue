<template>
    <div>
        <eval-page
            kind="applications"
            :discussion-evaluations-title="
                loggedInUser.isNat ?
                    'Group Evaluations' :
                    'Completed Evaluations'
            "
            :discussion-evaluations-help="
                loggedInUser.isNat ?
                    'After individual evals are completed, their responses are made visible to allow discussion and form a consensus' :
                    'Results of archived evaluations you were assigned to'
            "
        >
            <template #instructions>
                <evaluation-instructions />
            </template>
        </eval-page>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import EvalPage from '../components/evaluations/EvalPage.vue';
import EvaluationInstructions from '../components/evaluations/EvaluationInstructions.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'AppEvalPage',
    components: {
        EvalPage,
        EvaluationInstructions,
    },
    mixins: [ postData ],
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
};
</script>
