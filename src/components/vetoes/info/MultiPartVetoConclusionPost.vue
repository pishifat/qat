<template>
    <div id="conclusion" class="collapse card card-body my-2 small pre-line">
        <span>This beatmap has undergone veto mediation by the Beatmap Nominators.</span>
        <br>
        <span>**Issue summary:** "{{ selectedVeto.reasons[reasonIndex].summary }}"</span>
        <span>**Original post:** {{ selectedVeto.reasons[reasonIndex].link }}</span>
        <br>

        <span>After an anonymous vote, this {{ selectedVeto.reasons.length > 1 ? 'portion of the veto' : 'veto' }} will be {{ isUpheld ? '**upheld**' : '**dismissed**' }}.</span>
        <span>Reasons why Beatmap Nominators {{ isUpheld ? 'agree' : 'disagree' }} with it can be found here: https://bn.mappersguild.com/message?veto={{ selectedVeto.id }}</span>
        <br>

        <div v-if="isUpheld">
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
        isUpheld () {
            if (this.selectedVeto.vetoFormat >= 5) {
                const sum = this.upholdMediations.length + this.withdrawMediations.length;
                let threshold;

                if (this.selectedVeto.vetoFormat == 5) {
                    threshold = 0.7 * sum;
                }
                
                if (this.selectedVeto.vetoFormat == 6) {
                    threshold = 0.6 * sum;
                }

                if (this.selectedVeto.vetoFormat >= 7) {
                    return this.selectedVeto.reasons[this.reasonIndex].status == 'upheld';
                }

                return this.upholdMediations.length >= threshold;
            } else {
                return this.upholdMediations.length > this.withdrawMediations.length;
            }
        },
    },
};
</script>
