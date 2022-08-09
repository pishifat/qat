<template>
    <div id="conclusion" class="collapse card card-body my-2 small pre-line">
        <span>Hello! This beatmap has undergone veto mediation by the Beatmap Nominators. The veto post can be found here: {{ selectedVeto.discussionLink }}</span>
        <br>
        <span>After an anonymous vote, it has been decided that the veto will be {{ upholdMediations.length > withdrawMediations.length ? 'upheld' : 'dismissed' }}. The following are reasons why Beatmap Nominators {{ upholdMediations.length > withdrawMediations.length ? 'agree' : 'disagree' }} with the veto:</span>
        <br>
        <br>

        <div v-if="upholdMediations.length > withdrawMediations.length">
            <div v-for="(mediation, i) in upholdMediations" :key="mediation.id">
                <div>
                    <span>({{ i + 1 }}{{ mediation.vote === 2 ? ' - partially agree' : '' }}): {{ mediation.comment }}</span>
                </div>
                <br>
            </div>
            <span>This beatmap cannot be nominated until changes are made that address the veto's concerns and the veto-ing nominator is satisfied (within reasonable limits).</span>
        </div>

        <div v-else>
            <div v-for="(mediation, i) in withdrawMediations" :key="mediation.id">
                <div>
                    <span>({{ i + 1 }}{{ mediation.vote === 2 ? ' - partially agree' : '' }}): {{ mediation.comment }}</span>
                </div>
                <br>
            </div>
            <span>Due to the veto being withdrawn, this beatmap may now be re-nominated.</span>
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
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
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
