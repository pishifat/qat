<template>
    <div>
        <div v-if="selectedVeto.mediations.length">
            <!-- restart mediation if concluded -->
            <button
                v-if="selectedVeto.status == 'archive'"
                class="btn btn-sm btn-danger w-100 mb-2"
                @click="continueMediation($event)"
            >
                Resume veto mediation
            </button>

            <!-- conclude mediation -->
            <button
                v-else
                class="btn btn-sm w-100 btn-danger mb-2"
                @click="concludeMediation($event)"
            >
                Conclude mediation
            </button>

            <!-- view conclusion discussion post -->
            <button class="btn btn-sm w-100 btn-primary mb-2" data-bs-toggle="collapse" data-bs-target="#conclusion">
                Show full conclusion post(s) <i class="fas fa-angle-down" />
            </button>
            <div v-if="selectedVeto.vetoFormat >= 2">
                <div v-for="(reason, i) in selectedVeto.reasons" :key="i">
                    <multi-part-veto-conclusion-post
                        :reason-index="i"
                    />
                </div>
            </div>

            <!-- view mediator chat message -->
            <button class="btn btn-sm w-100 btn-primary mb-2" data-bs-toggle="collapse" data-bs-target="#messages">
                Show veto chat messages <i class="fas fa-angle-down" />
            </button>
            <veto-chat-message
                id="messages"
                class="collapse"
                :users="[]"
            />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import MultiPartVetoConclusionPost from './MultiPartVetoConclusionPost.vue';
import VetoChatMessage from '../VetoChatMessage.vue';

export default {
    name: 'AdminButtons',
    components: {
        MultiPartVetoConclusionPost,
        VetoChatMessage,
    },
    data() {
        return {
            mediators: null,
            excludeUsers: '',
        };
    },
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
        slimmedMediators() {
            if (this.mediators) {
                const tempUsers = [];

                for (const mediator of this.mediators) {
                    tempUsers.push({ osuId: mediator.osuId });
                }

                return tempUsers;
            } else return [];
        },
    },
    watch: {
        selectedVeto() {
            this.mediators = null;
        },
    },
    methods: {
        commitVeto (veto, message) {
            if (veto && !veto.error) {
                this.$store.commit('vetoes/updateVeto', veto);
                this.$store.dispatch('updateToastMessages', {
                    message,
                    type: 'success',
                });
            }
        },
        async concludeMediation (e) {
            const result = confirm(`Are you sure?`);

            if (result) {
                const veto = await this.$http.executePost(
                    `/vetoes/concludeMediation/${this.selectedVeto.id}`, {}, e);
                this.commitVeto(veto, 'Concluded mediation');
            }
        },

        async continueMediation (e) {
            const result = confirm(`Are you sure? This should only be done if a mistake was made.`);

            if (result) {
                const veto = await this.$http.executePost(`/vetoes/continueMediation/${this.selectedVeto.id}`, {}, e);

                this.commitVeto(veto, 'Re-opened mediation');
            }
        },
    },
};
</script>