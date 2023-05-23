<template>
    <div>
        <p>
            <b>Permalink:</b>
            <a :href="'https://bn.mappersguild.com/message?eval=' + selectedEvaluation.id" target="_blank">
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
