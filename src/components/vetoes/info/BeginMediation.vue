<template>
    <div>
        <div v-if="selectedVeto.status == 'available'">
            <b>Mediation phase</b>
            <div class="mb-2 mt-2 ml-4">
                Exclude specific user(s):
                <input
                    v-model="excludeUsers"
                    class="form-control w-75 small"
                    type="text"
                    placeholder="username1, username2, username3..."
                >
                <div class="small text-secondary">
                    The mapper and veto submitter are automatically excluded. Please manually exclude any guest difficulty creators and the nominating BNs.
                </div>
            </div>
        </div>
        <!--<button class="btn btn-sm btn-block btn-danger mb-2" @click="deleteVeto($event)">
            Delete veto
        </button>-->

        <button class="btn btn-sm btn-block btn-primary" @click="selectMediators($event)">
            {{ mediators ? 'Re-select mediators' : 'Select mediators' }}
        </button>

        <div v-if="mediators">
            <hr />

            <!-- begin mediation -->
            <button class="btn btn-sm btn-block btn-success mb-2" @click="beginMediation($event)">
                Begin mediation
            </button>

            <!-- list mediators -->
            <div class="row">
                <div class="col-sm-3 align-self-center">
                    <b>Users:</b>
                    <div id="usernames" class="card card-body small">
                        <ul class="list-unstyled">
                            <li v-for="user in mediators" :key="user.id">
                                {{ user.username }}
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- chat preview -->
                <div class="col-sm-9">
                    <b>Chat messages:</b>
                    <veto-chat-message
                        :users="slimmedMediators"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import VetoChatMessage from '../VetoChatMessage.vue';

export default {
    name: 'AdminButtons',
    components: {
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
        async beginMediation (e) {
            const result = confirm(`Make sure to send messages prior to starting a mediation. If you've already done this, press OK.`);

            if (result) {
                const result2 = confirm(`ARE YOU REALLY SURE YOU'VE SENT THE MESSAGES? DON'T BE STUPID.`);

                if (result2) {
                    const mediatorIds = this.mediators.map(m => m._id);
                    const veto = await this.$http.executePost(`/vetoes/beginMediation/${this.selectedVeto.id}`, { mediatorIds, reasons: this.selectedVeto.reasons }, e);

                    this.commitVeto(veto, 'Started veto mediation');
                }
            } 
        },
        async selectMediators (e) {
            let excludeUsers = this.excludeUsers.split(',');

            for (let i = 0; i < excludeUsers.length; i++) {
                excludeUsers[i] = excludeUsers[i].trim().toLowerCase();
            }

            excludeUsers.push(this.selectedVeto.beatmapMapper.toLowerCase(), this.selectedVeto.vetoer.username.toLowerCase());

            const result = await this.$http.executePost('/vetoes/selectMediators', { mode: this.selectedVeto.mode, excludeUsers }, e);

            if (result && !result.error) {
                this.mediators = result;
            }
        },
        async deleteVeto (e) {
            if (confirm(`Are you sure?`)) {
                const result = await this.$http.executePost(`/vetoes/deleteVeto/${this.selectedVeto.id}`, e);

                if (result && !result.error) {
                    const res = await this.$http.executeGet('/vetoes/relevantInfo/');

                    if (res) {
                        $('#extendedInfo').modal('hide');
                        this.$store.commit('vetoes/setVetoes', res.vetoes);
                    }
                }
            }
        },
    },
};
</script>