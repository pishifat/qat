<template>
    <div>
        <div v-if="selectedVeto.vetoFormat >= 2">
            <div v-for="(reason, reasonIndex) in selectedVeto.reasons" :key="reasonIndex">
                <a v-if="selectedVeto.reasons.length > 1" :href="reason.link" target="_blank">{{ reasonIndex+1 }}. {{ reason.summary }}</a>
                <span v-for="(mediation, i) in selectedVeto.mediations" :key="mediation.id">
                    <div v-if="mediation.reasonIndex == reasonIndex">
                        <mediation-response
                            :mediation="mediation"
                            :i="i"
                        />
                    </div>
                </span>
            </div>
        </div>
        <div v-else>
            <div v-for="(mediation, i) in selectedVeto.mediations" :key="mediation.id">
                <mediation-response
                    :mediation="mediation"
                    :i="i"
                />
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import MediationResponse from './MediationResponse.vue';

export default {
    name: 'Mediations',
    components: {
        MediationResponse,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
    },
};
</script>
