<template>
    <div>
        <b>Mediations</b>
        <div v-if="selectedVeto.vetoFormat >= 2" class="mt-1">
            <div v-for="(reason, reasonIndex) in selectedVeto.reasons" :key="reasonIndex" class="card mb-2">
                <!-- collapse trigger styled as card header -->
                <button
                    v-if="selectedVeto.reasons.length"
                    type="button"
                    class="card-header py-2 w-100 text-start border-0 d-flex align-items-center text-decoration-none"
                    :data-bs-target="'#reason-' + (reasonIndex + 1)"
                    data-bs-toggle="collapse"
                    aria-expanded="false"
                    :aria-controls="'reason-' + (reasonIndex + 1)"
                >
                    <span v-if="selectedVeto.vetoFormat >= 7 && selectedVeto.status == 'archive'" class="me-2">
                        <i v-if="reason.status === 'upheld'" class="fas fa-check-circle text-success" data-bs-toggle="tooltip" data-bs-placement="top" title="upheld" />
                        <i v-else-if="reason.status === 'dismissed'" class="fas fa-times-circle text-danger" data-bs-toggle="tooltip" data-bs-placement="top" title="dismissed" />
                        <i v-else class="fas fa-question-circle text-secondary" data-bs-toggle="tooltip" data-bs-placement="top" title="pending status" />
                    </span>
                    <b class="flex-grow-1">{{ reasonIndex + 1 }}. {{ reason.summary }}</b>
                    <i class="fas fa-angle-down ms-1 collapse-chevron" />
                </button>

                <!-- menu content -->
                <div :id="'reason-' + (reasonIndex + 1)" class="collapse">
                    <div class="card-body">
                    <div v-if="selectedVeto.reasons.length">
                        <b>Stats</b>
                        <vote-stats
                            v-if="selectedVeto.vetoFormat < 7"
                            :reason-index="reasonIndex"
                            :mediations="selectedVeto.mediations.filter(m => m.reasonIndex === reasonIndex)"
                        />
                        <div v-else>
                            <ul>
                                <li>If both groups are above the uphold threshold, the veto is <b class="text-success">upheld</b>.</li>
                                <li>If both groups are below the uphold threshold, the veto is <b class="text-danger">dismissed</b>.</li>
                                <li>If neither group reaches the same consensus, <b>the public vote determines the consensus</b>.</li>
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
                            <div v-if="selectedVeto.reasons[reasonIndex].status">
                                <p>
                                    This veto reason has been marked as 
                                    <b :class="selectedVeto.reasons[reasonIndex].status === 'upheld' ? 'text-success' : 'text-danger'">
                                        {{ selectedVeto.reasons[reasonIndex].status }}
                                    </b>.
                                </p>
                            </div>
                            <div v-if="loggedInUser && loggedInUser.isNat && selectedVeto.status == 'archive'">
                                <hr />
                                <b>NAT moderation</b>
                                <div class="small text-secondary">
                                    Based on the info above, mark the veto reason as "upheld" or "dismissed".
                                </div>
                                <div class="row">
                                    <div class="col-sm-6">
                                        <button
                                            class="btn btn-sm btn-success w-100 mb-2"
                                            @click="setVetoReasonStatus('upheld', reasonIndex, $event)"
                                        >
                                            Mark veto reason as "upheld"
                                        </button>
                                    </div>

                                    <!-- move to "archive" status -->
                                    <div class="col-sm-6">
                                        <button
                                            class="btn btn-sm w-100 btn-danger mb-2"
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
                            <a v-if="getSafeReasonLink(reason.link)" :href="getSafeReasonLink(reason.link)" target="_blank" rel="noopener noreferrer">{{ reason.link }}</a>
                            <span v-else>{{ reason.link }}</span>
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
        getSafeReasonLink(link) {
            return this.sanitizeUrl(link);
        },
        async setVetoReasonStatus (status, reasonIndex, e) {
            if (!confirm(`Are you sure you want to mark this veto reason as "${status}"?`)) return;

            const data = await this.$http.executePost(`/vetoes/setVetoReasonStatus/${this.selectedVeto.id}`, { status, reasonIndex }, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
            }
        },
    },
};
</script>

<style scoped>
.card-header[data-bs-toggle="collapse"] {
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-radius: 0.25rem;
}
.card-header[data-bs-toggle="collapse"]:hover {
    background-color: rgba(0, 0, 0, 0.1) !important;
    border-radius: 0.25rem;
}
.collapse-chevron {
    transition: transform 0.25s ease;
}
.card-header[data-bs-toggle="collapse"][aria-expanded="true"] .collapse-chevron {
    transform: rotate(180deg);
}
</style>
