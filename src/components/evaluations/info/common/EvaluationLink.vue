<template>
    <div>
        <p>
            <b>Message link:</b>
            <a :href="'/message?eval=' + selectedEvaluation.id" target="_blank">
                https://bn.mappersguild.com/message?eval={{ selectedEvaluation.id }}
            </a>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'EvaluationLink',
    computed: {
        ...mapGetters('evaluations', ['selectedEvaluation']),
    },
};
</script>
