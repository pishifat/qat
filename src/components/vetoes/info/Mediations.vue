<template>
    <div>
        <b>Mediations:</b>
        <div v-if="selectedVeto.vetoFormat >= 2">
            <div v-for="(reason, reasonIndex) in selectedVeto.reasons" :key="reasonIndex">
                <a v-if="selectedVeto.reasons.length > 1" :href="'#reason-' + (reasonIndex + 1)" data-toggle="collapse">{{ reasonIndex + 1 }}. {{ reason.summary }} <i class="fas fa-angle-down" /></a>
                <a v-else :href="'#reason-' + (reasonIndex + 1)" data-toggle="collapse">View mediations <i class="fas fa-angle-down" /></a>
                <div :id="'reason-' + (reasonIndex + 1)" class="collapse">
                    <span v-if="selectedVeto.reasons.length > 1">
                        <hr />
                        <b>Discussion link:</b>
                        <a :href="reason.link" target="_blank">{{ reason.link }}</a>
                    </span>
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
