<template>
    <div id="conclusion" class="collapse card card-body my-2 small pre-line">
        <span>This beatmap has undergone veto mediation.</span>
        <br>

        <template v-for="(item, i) in reasonBlocks" :key="i">
            <span>---</span>
            <span>"{{ item.summary }}"</span>
            <span v-if="item.link"> **Original post:** {{ item.link }}</span>
            <br>
            <span>Outcome: {{ item.isUpheld ? '**upheld**' : '**dismissed**' }}</span>
        </template>
        <span>---</span>

        <br>
        <span>View the full outcome of this veto here: https://bn.mappersguild.com/vetoes?id={{ selectedVeto.id }}</span>
        <br>

        <div v-if="allDismissed">
            <span>This veto has been dismissed. This beatmap may now be re-nominated.</span>
        </div>

        <div v-else>
            <span>This beatmap cannot be nominated until changes are made that address the veto's concerns and the veto-ing nominator is satisfied (within reasonable limits).</span>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'MultiPartVetoConclusionPost',
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
        reasonSummariesWithLinks () {
            const reasons = this.selectedVeto.reasons || [];
            return reasons.map((r, i) => ({
                summary: r.summary,
                link: r.link || null,
                reasonIndex: i,
            }));
        },
        reasonBlocks () {
            return this.reasonSummariesWithLinks.map((item, i) => ({
                ...item,
                isUpheld: this.isReasonUpheld(i),
            }));
        },
        reasonOutcomes () {
            const reasons = this.selectedVeto.reasons || [];
            return reasons.map((_, i) => ({
                reasonIndex: i,
                isUpheld: this.isReasonUpheld(i),
            }));
        },
        allUpheld () {
            return this.reasonOutcomes.length > 0 && this.reasonOutcomes.every(o => o.isUpheld);
        },
        allDismissed () {
            return this.reasonOutcomes.length > 0 && this.reasonOutcomes.every(o => !o.isUpheld);
        },
        agreementSentence () {
            if (this.allUpheld) return 'agree with it';
            if (this.allDismissed) return 'disagree with it';
            return 'agree or disagree with each portion';
        },
    },
    methods: {
        isReasonUpheld (reasonIndex) {
            const veto = this.selectedVeto;
            const upholdMediations = veto.mediations.filter(m => m.vote && m.reasonIndex === reasonIndex && m.vote !== 3);
            const withdrawMediations = veto.mediations.filter(m => m.vote && m.reasonIndex === reasonIndex && m.vote !== 1);

            if (veto.vetoFormat >= 5) {
                const sum = upholdMediations.length + withdrawMediations.length;
                let threshold;

                if (veto.vetoFormat === 5) threshold = 0.7 * sum;
                else if (veto.vetoFormat === 6) threshold = 0.6 * sum;
                else if (veto.vetoFormat >= 7) {
                    const status = veto.reasons[reasonIndex] && veto.reasons[reasonIndex].status;
                    return status === 'upheld';
                }

                return sum > 0 && upholdMediations.length >= threshold;
            }
            return upholdMediations.length > withdrawMediations.length;
        },
    },
};
</script>
