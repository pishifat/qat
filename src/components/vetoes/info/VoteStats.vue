<template>
    <div v-if="selectedVeto.vetoFormat >= 2">
        <b v-if="groupHeader.length">{{ groupHeader }}</b>
        <div>
            <ul>
                <li>
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of submitted votes">
                        <b>Agree:</b> {{ upholdMediations.length }} ({{ Math.round(upholdMediations.length / validMediations.length * 100) || '0' }}%)
                    </label>
                    <small v-if="selectedVeto.vetoFormat >= 6" class="ml-1 text-secondary">Uphold threshold: 60%</small>
                </li>
                <li v-if="neutralMediations.length" >
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of submitted votes">
                        <b>{{ selectedVeto.vetoFormat >= 7 ? 'Neutral' : 'Partially Agree' }}:</b> {{ neutralMediations.length }} ({{ Math.round(neutralMediations.length / validMediations.length * 100) || '0' }}%)
                    </label>
                </li>
                <li>
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of submitted votes">
                        <b>Disagree:</b> {{ withdrawMediations.length }} ({{ Math.round(withdrawMediations.length / validMediations.length * 100) || '0' }}%)
                    </label>
                </li>
                <li v-if="!isPublic">
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="% of assigned mediators">
                        <b>Submitted votes:</b> {{ validMediations.length }} ({{ Math.round(validMediations.length / mediations.length * 100) || '0' }}%)
                    </label>
                </li>
                <li v-if="!isPublic">
                    <label class="mb-0" data-toggle="tooltip" data-placement="right" title="users involved">
                        <b>Assigned mediators:</b> {{ mediations.length }}
                    </label>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'VoteStats',
    props: {
        reasonIndex: {
            type: Number,
            required: true,
        },
        mediations: {
            type: Array,
            required: true,
        },
        groupHeader: {
            type: String,
            default: '',
        },
        isPublic: {
            type: Boolean,
            default: false,
        }
    },
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
        upholdMediations () {
            return this.mediations.filter(mediation => mediation.vote == 1);
        },
        neutralMediations () {
            return this.mediations.filter(mediation => mediation.vote == 2);
        },
        withdrawMediations () {
            return this.mediations.filter(mediation => mediation.vote  == 3);
        },
        submittedVotes () {
            return this.upholdMediations.length + this.neutralMediations.length + this.withdrawMediations.length;
        },
        validMediations () {
            return this.mediations.filter(mediation => mediation.vote);
        }
    },
    methods: {
        filterMediationsByIndex(mediations, index) {
            return mediations.filter(mediation => mediation.reasonIndex == index);
        },
    }
};
</script>
