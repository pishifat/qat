<template>
    <div v-if="selectedVeto.vetoFormat >= 2">
        <hr>
        <b>Stats:</b>
        <div v-for="(reason, reasonIndex) in selectedVeto.reasons" :key="reasonIndex">
            <a v-if="selectedVeto.reasons.length > 1" :href="reason.link" target="_blank">{{ reasonIndex + 1 }}. {{ reason.summary }}</a>
            <ul>
                <li>
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of submitted votes">
                        <b>Agree:</b> {{ filterMediationsByIndex(upholdMediations, reasonIndex).length }} ({{ Math.round(filterMediationsByIndex(upholdMediations, reasonIndex).length / filterMediationsByIndex(validMediations, reasonIndex).length * 100) || '0' }}%)
                    </label>
                </li>
                <li v-if="filterMediationsByIndex(neutralMediations, reasonIndex).length" >
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of submitted votes">
                        <b>Partially Agree:</b> {{ filterMediationsByIndex(neutralMediations, reasonIndex).length }} ({{ Math.round(filterMediationsByIndex(neutralMediations, reasonIndex).length / filterMediationsByIndex(validMediations, reasonIndex).length * 100) || '0' }}%)
                    </label>
                </li>
                <li>
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of submitted votes">
                        <b>Disagree:</b> {{ filterMediationsByIndex(withdrawMediations, reasonIndex).length }} ({{ Math.round(filterMediationsByIndex(withdrawMediations, reasonIndex).length / filterMediationsByIndex(validMediations, reasonIndex).length * 100) || '0' }}%)
                    </label>
                </li>
                <li>
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of assigned mediators">
                        <b>Submitted votes:</b> {{ filterMediationsByIndex(validMediations, reasonIndex).length }} ({{ Math.round(filterMediationsByIndex(validMediations, reasonIndex).length / (selectedVeto.mediations.length / selectedVeto.reasons.length) * 100) || '0' }}%)
                    </label>
                </li>
                <li>
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="users involved">
                        <b>Assigned mediators:</b> {{ selectedVeto.mediations.length / selectedVeto.reasons.length }}
                    </label>
                </li>
            </ul>
        </div>
        <hr>
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
        validMediations () {
            return this.selectedVeto.mediations.filter(mediation => mediation.vote);
        }
    },
    methods: {
        filterMediationsByIndex(mediations, index) {
            return mediations.filter(mediation => mediation.reasonIndex == index);
        },
    }
};
</script>
