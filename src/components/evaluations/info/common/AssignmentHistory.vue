<template>
    <div>
        <b>Assignment history:</b>
        <ul class="small">
            <li v-for="(reroll, i) in selectedEvaluation.rerolls" :key="i">
                <b>{{ reroll.createdAt.toString().slice(0,10) }}:</b>
                {{ reroll.type == 'automatic' ? 'Automatically added ' : 'Manually replaced ' }}
                <span v-if="reroll.type == 'manual'">
                    <user-link 
                        :username="reroll.oldEvaluator.username"
                        :osu-id="reroll.oldEvaluator.osuId"
                    />
                    with
                </span>
                <user-link 
                    :username="reroll.newEvaluator.username"
                    :osu-id="reroll.newEvaluator.osuId"
                />
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserLink from '../../../UserLink.vue';

export default {
    name: 'EvaluatorAssignments',
    components: {
        UserLink,
    },
    data() {
        return {
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
    },
    methods: {
    },
};
</script>
