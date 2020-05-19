<template>
    <div id="conclusion" class="copy-paste collapse">
        <samp class="small">Hello! This beatmap has undergone veto mediation by the Beatmap Nominators. The veto post can be found here: {{ selectedVeto.discussionLink }}</samp><br><br>
        <samp class="small">After an anonymous vote, it has been decided that the veto will be {{ majorityUphold ? 'upheld' : 'dismissed' }}. The following are reasons why Beatmap Nominators {{ majorityUphold ? 'agree' : 'disagree' }} with the veto:</samp><br><br>
        <div v-if="majorityUphold">
            <span v-for="(mediation, i) in upholdMediations" :key="mediation.id">
                <samp><pre class="small">({{ i + 1 }}{{ mediation.vote === 2 ? ' - neutral' : '' }}): {{ mediation.comment }}</pre></samp><br>
            </span>
            <samp class="small">This beatmap cannot be nominated until changes are made that address the veto's concerns and the veto-ing nominator is satisfied (within reasonable limits).</samp>
        </div>
        <div v-else>
            <span v-for="(mediation, i) in withdrawMediations" :key="mediation.id">
                <samp><pre class="small">({{ i + 1 }}{{ mediation.vote === 2 ? ' - neutral' : '' }}): {{ mediation.comment }}</pre></samp><br>
            </span>
            <samp class="small">Due to the veto being withdrawn, this beatmap may now be re-nominated.</samp><br><br>
        </div>
        <samp class="small">Users involved in this veto's mediation:</samp><br>
        <ul style="list-style-type: none; padding: 0">
            <li v-for="mediation in shuffledMediations" :key="mediation.id">
                <samp class="small">- {{ mediation.mediator.username }}</samp>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'ConclusionPost',
    computed: {
        ...mapGetters([
            'selectedVeto',
            'majorityUphold',
        ]),
        shuffledMediations () {
            let shuffled = this.selectedVeto.mediations.filter(m => m.vote);

            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            return shuffled;
        },
        upholdMediations () {
            return this.selectedVeto.mediations.filter(mediation => mediation.vote && mediation.vote !== 3);
        },
        withdrawMediations () {
            return this.selectedVeto.mediations.filter(mediation => mediation.vote && mediation.vote !== 1);
        },
    },
};
</script>
