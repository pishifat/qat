<template>
    <div>
        <b>Mediations</b>
        <div v-if="selectedVeto.vetoFormat >= 2" class="mt-1">
            <div v-for="(reason, reasonIndex) in selectedVeto.reasons" :key="reasonIndex" class="mb-2">
                <!-- collapse menu -->
                <a
                    v-if="selectedVeto.reasons.length"
                    :href="'#reason-' + (reasonIndex + 1)"
                    data-toggle="collapse"
                    class="ml-4"
                >
                    <b>{{ reasonIndex + 1 }}. {{ reason.summary }}</b> <span v-if="selectedVeto.vetoFormat >= 7 && selectedVeto.status == 'archive'">({{ reason.status ? reason.status : 'pending status' }}) </span><i class="fas fa-angle-down" />
                </a>

                <!-- menu content -->
                <div :id="'reason-' + (reasonIndex + 1)" class="collapse">
                    <!-- discussion link + stats -->
                    <div v-if="selectedVeto.reasons.length">
                        <hr>
                        <b>Stats</b>
                        <vote-stats
                            v-if="selectedVeto.vetoFormat < 7"
                            :reason-index="reasonIndex"
                            :mediations="selectedVeto.mediations.filter(m => m.reasonIndex === reasonIndex)"
                        />
                        <div v-else>
                            <ul>
                                <li>If both groups are above the uphold threshold, the veto is upheld.</li>
                                <li>If both groups are below the uphold threshold, the veto is dismissed.</li>
                                <li>If neither group reaches the same consensus, a public vote determines the consensus.</li>
                            </ul>
                            <div class="row small">
                                <vote-stats
                                    class="col-sm-4"
                                    :reason-index="reasonIndex"
                                    :mediations="mediationsGroup1(reasonIndex)"
                                    :group-header="'Group 1'"
                                />
                                <vote-stats
                                    class="col-sm-4"
                                    :reason-index="reasonIndex"
                                    :mediations="mediationsGroup2(reasonIndex)"
                                    :group-header="'Group 2'"
                                />
                                <vote-stats
                                    class="col-sm-4"
                                    :reason-index="reasonIndex"
                                    :mediations="selectedVeto.publicMediations.filter(m => m.reasonIndex === reasonIndex)"
                                    :group-header="'Public vote'"
                                    :is-public="true"
                                />
                            </div>
                            <div v-if="loggedInUser && loggedInUser.isNat && selectedVeto.status == 'archive'">
                                <b>NAT moderation</b>
                                <div class="small text-secondary">
                                    Based on the info above, mark the veto reason as "upheld" or "dismissed".
                                </div>
                                <div class="row">
                                    <div class="col-sm-6">
                                        <button
                                            class="btn btn-sm btn-primary btn-block mb-2"
                                            @click="setVetoReasonStatus('upheld', reasonIndex, $event)"
                                        >
                                            Mark veto reason as "upheld"
                                        </button>
                                    </div>

                                    <!-- move to "archive" status -->
                                    <div class="col-sm-6">
                                        <button
                                            class="btn btn-sm btn-block btn-primary mb-2"
                                            @click="setVetoReasonStatus('dismissed', reasonIndex, $event)"
                                        >
                                            Mark veto reason as "dismissed"
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="selectedVeto.vetoFormat < 7">
                            <b>Discussion link:</b>
                            <a :href="reason.link" target="_blank">{{ reason.link }}</a>
                        </div>
                        <hr>
                    </div>

                    <!-- mediations -->
                    <div v-if="selectedVeto.vetoFormat < 7">
                        <div v-for="(mediation, i) in selectedVeto.mediations" :key="mediation.id">
                            <div v-if="mediation.reasonIndex == reasonIndex">
                                <mediation-response
                                    :mediation="mediation"
                                    :i="i"
                                />
                            </div>
                        </div>
                    </div>
                    <div v-else class="row small">
                        <div class="col-sm-6">
                            <b>Group 1</b>
                            <div v-for="(mediation, i) in mediationsGroup1(reasonIndex)" :key="mediation.id">
                                <div v-if="mediation.reasonIndex == reasonIndex">
                                    <mediation-response
                                        :mediation="mediation"
                                        :i="i"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <b>Group 2</b>
                            <div v-for="(mediation, i) in mediationsGroup2(reasonIndex)" :key="mediation.id">
                                <div v-if="mediation.reasonIndex == reasonIndex">
                                    <mediation-response
                                        :mediation="mediation"
                                        :i="i"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
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
            'mediationsGroup1',
            'mediationsGroup2',
        ]),
    },
    methods: {
        async setVetoReasonStatus (status, reasonIndex, e) {
            const data = await this.$http.executePost(`/vetoes/setVetoReasonStatus/${this.selectedVeto.id}`, { status, reasonIndex }, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
            }
        },
    },
};
</script>
