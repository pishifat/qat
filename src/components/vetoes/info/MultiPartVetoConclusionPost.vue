<template>
    <div id="conclusion" class="collapse card card-body my-2 small pre-line">
        <span>This beatmap has undergone veto mediation by the Beatmap Nominators.</span>
        <br>
        <span>Issue summary: "{{ selectedVeto.reasons[reasonIndex].summary }}"</span>
        <br>
        <span>Original post: {{ selectedVeto.reasons[reasonIndex].link }}</span>
        <br>

        <span>After an anonymous vote, this {{ selectedVeto.reasons.length > 1 ? 'portion of the veto' : 'veto' }} will be {{ upholdMediations.length > withdrawMediations.length ? 'upheld' : 'dismissed' }}. Reasons why Beatmap Nominators {{ upholdMediations.length > withdrawMediations.length ? 'agree' : 'disagree' }} with it:</span>
        <br>
        <br>

        <div v-if="upholdMediations.length > withdrawMediations.length">
            <div v-for="(mediation, i) in upholdMediations" :key="mediation.id">
                <div>
                    <span>({{ i + 1 }}{{ mediation.vote === 2 ? ' - neutral' : '' }}): {{ mediation.comment }}</span>
                </div>
                <br>
            </div>
            <span>This beatmap cannot be nominated until changes are made that address the veto's concerns and the veto-ing nominator is satisfied (within reasonable limits).</span>
        </div>

        <div v-else>
            <div v-for="(mediation, i) in withdrawMediations" :key="mediation.id">
                <div>
                    <span>({{ i + 1 }}{{ mediation.vote === 2 ? ' - neutral' : '' }}): {{ mediation.comment }}</span>
                </div>
                <br>
            </div>
            <span>If all portions of the veto have been dismissed, this beatmap may now be re-nominated.</span>
        </div>

        <br>

        <span>Users involved in this veto's mediation: </span>

        <ul class="list-unstyled">
            <li v-for="mediation in shuffledMediations" :key="mediation.id">
                <span>- {{ mediation.mediator && mediation.mediator.username }}</span>
            </li>
        </ul>
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
