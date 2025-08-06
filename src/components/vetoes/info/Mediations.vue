<template>
    <div>
        <b>Mediations:</b>
        <div v-if="selectedVeto.vetoFormat >= 2">
            <div v-for="(reason, reasonIndex) in selectedVeto.reasons" :key="reasonIndex" class="mb-2">

                <!-- collapse menu -->
                <a v-if="selectedVeto.reasons.length" :href="'#reason-' + (reasonIndex + 1)" data-toggle="collapse">
                    {{ reasonIndex + 1 }}. {{ reason.summary }} <i class="fas fa-angle-down" />
                </a>

                <!-- menu content -->
                <div :id="'reason-' + (reasonIndex + 1)" class="collapse">

                    <!-- discussion link + stats -->
                    <span v-if="selectedVeto.reasons.length">
                        <hr />
                        <vote-stats :reason-index="reasonIndex" />
                        <b class="mr-1">Discussion link:</b>
                        <a :href="reason.link" target="_blank">{{ reason.link }}</a>
                        <hr />
                    </span>

                    <!-- mediations -->
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

        <!-- old mediations -->
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
import VoteStats from './VoteStats.vue';

export default {
    name: 'Mediations',
    components: {
        MediationResponse,
        VoteStats,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
            'isMediator',
        ]),
    },
};
</script>
