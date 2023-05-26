<template>
    <div class="mb-2">
        <hr>
        Stats:

        <ul>
            <li >
                <b>Agree:</b> {{ upholdMediations.length }} ({{ Math.round(upholdMediations.length / selectedVeto.mediations.length * 100) || '0' }}%)
            </li>
            <li v-if="neutralMediations.length" >
                <b>Partially Agree:</b> {{ neutralMediations.length }} ({{ Math.round(neutralMediations.length / selectedVeto.mediations.length * 100) || '0' }}%)
            </li>
            <li>
                <b>Disagree:</b> {{ withdrawMediations.length }} ({{ Math.round(withdrawMediations.length / selectedVeto.mediations.length * 100) || '0' }}%)
            </li>
            <li>
                <b>Submitted votes:</b> {{ upholdMediations.length + neutralMediations.length + withdrawMediations.length }} ({{ Math.round((upholdMediations.length + neutralMediations.length + withdrawMediations.length) / selectedVeto.mediations.length * 100) || '0' }}%)
            </li>
            <li>
                <b>Assigned mediators:</b> {{ selectedVeto.mediations.length }}
            </li>
        </ul>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'VoteCount',
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
        upholdMediations () {
            return this.selectedVeto.mediations.filter(mediation => mediation.vote == 1);
        },
        neutralMediations () {
            return this.selectedVeto.mediations.filter(mediation => mediation.vote == 2);
        },
        withdrawMediations () {
            return this.selectedVeto.mediations.filter(mediation => mediation.vote  == 3);
        },
    },
};
</script>
