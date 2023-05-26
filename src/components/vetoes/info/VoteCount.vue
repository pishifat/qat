<template>
    <div class="mb-2">
        <hr>
        Stats:

        <ul>
            <li>
                <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of submitted votes">
                    <b>Agree:</b> {{ upholdMediations.length }} ({{ Math.round(upholdMediations.length / submittedVotes * 100) || '0' }}%)
                </label>
            </li>
            <li v-if="neutralMediations.length" >
                <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of submitted votes">
                    <b>Partially Agree:</b> {{ neutralMediations.length }} ({{ Math.round(neutralMediations.length / submittedVotes * 100) || '0' }}%)
                </label>
            </li>
            <li>
                <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of submitted votes">
                    <b>Disagree:</b> {{ withdrawMediations.length }} ({{ Math.round(withdrawMediations.length / submittedVotes * 100) || '0' }}%)
                </label>
            </li>
            <li>
                <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of assigned mediators">
                    <b>Submitted votes:</b> {{ submittedVotes }} ({{ Math.round(submittedVotes / selectedVeto.mediations.length * 100) || '0' }}%)
                </label>
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
        submittedVotes () {
            return this.upholdMediations.length + this.neutralMediations.length + this.withdrawMediations.length;
        },
    },
};
</script>
