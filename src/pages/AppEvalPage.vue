<template>
    <div>
        <eval-page
            kind="applications"
            :discussion-evaluations-title="
                loggedInUser.isNatOrTrialNat ?
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

export default {
    name: 'AppEvalPage',
    // @ts-ignore
    metaInfo: {
        meta: [
            { property: 'og:title', content: 'Application Evaluations · BN Management' },
            { property: 'og:description', content: 'The place for everything related to the Beatmap Nominators!' },
        ],
    },
    components: {
        EvalPage,
        EvaluationInstructions,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
};
</script>
