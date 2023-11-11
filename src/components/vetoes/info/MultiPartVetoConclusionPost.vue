<template>
    <div id="conclusion" class="collapse card card-body my-2 small pre-line">
        <span>This beatmap has undergone veto mediation by the Beatmap Nominators.</span>
        <br>
        <span>Issue summary: "{{ selectedVeto.reasons[reasonIndex].summary }}"</span>
        <span>Original post: {{ selectedVeto.reasons[reasonIndex].link }}</span>
        <br>

        <span>After an anonymous vote, this {{ selectedVeto.reasons.length > 1 ? 'portion of the veto' : 'veto' }} will be {{ upholdMediations.length > withdrawMediations.length ? '*upheld*' : '*dismissed*' }}.</span>
        <span>Reasons why Beatmap Nominators {{ upholdMediations.length > withdrawMediations.length ? 'agree' : 'disagree' }} with it can be found here: https://bn.mappersguild.com/message?veto={{ selectedVeto.id }}</span>

        <div v-if="upholdMediations.length > withdrawMediations.length">
            <span>This beatmap cannot be nominated until changes are made that address the veto's concerns and the veto-ing nominator is satisfied (within reasonable limits).</span>
        </div>

        <div v-else>
            <span>If all portions of the veto have been dismissed, this beatmap may now be re-nominated.</span>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'ConclusionPost',
    props: {
        reasonIndex: {
            type: Number,
            required: true,
        },
    },
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
        shuffledMediations () {
            let shuffled = this.selectedVeto.mediations.filter(m => m.vote && m.reasonIndex == this.reasonIndex);

            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            return shuffled;
        },
        upholdMediations () {
            return this.selectedVeto.mediations.filter(mediation => mediation.vote && mediation.reasonIndex == this.reasonIndex && mediation.vote !== 3);
        },
        withdrawMediations () {
            return this.selectedVeto.mediations.filter(mediation => mediation.vote && mediation.reasonIndex == this.reasonIndex && mediation.vote !== 1);
        },
    },
};
</script>
