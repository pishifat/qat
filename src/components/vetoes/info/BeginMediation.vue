<template>
    <div>
        <div v-if="selectedVeto.status == 'available'">
            <b>Mediation phase</b>
            <div class="mb-2 mt-2 ms-4">
                Exclude specific user(s):
                <input
                    v-model="excludeUsers"
                    class="form-control w-75 small"
                    type="text"
                    placeholder="username1, username2, username3..."
                >
                <div class="small text-secondary w-75">
                    The mapper, veto submitter, and vouching users are automatically excluded. Please manually exclude any guest difficulty creators, the nominating BNs, and anyone else who would be biased or otherwise unavailable.
                </div>
            </div>
        </div>

        <button class="btn btn-sm w-100 btn-primary" @click="selectMediators($event)">
            {{ mediators ? 'Re-select mediators' : 'Select mediators' }}
        </button>

        <div v-if="mediators">
            <hr>

            <!-- begin mediation -->
            <button class="btn btn-sm w-100 btn-success mb-2" @click="beginMediation($event)">
                Begin mediation
            </button>
            <div v-if="beginningMediation" class="mt-2 small text-secondary">
                this will take a few seconds...
            </div>

            <!-- list mediators -->
            <div class="row">
                <div class="col-sm-3">
                    <b>Group 1</b>
                    <div id="usernames1" class="card card-body small">
                        <ul class="list-unstyled">
                            <li v-for="user in group1" :key="user.id">
                                {{ user.username }}
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="col-sm-3">
                    <b>Group 2</b>
                    <div id="usernames2" class="card card-body small">
                        <ul class="list-unstyled">
                            <li v-for="user in group2" :key="user.id">
                                {{ user.username }}
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- chat preview -->
                <div class="col-sm-6">
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
            beginningMediation: false,
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
        group1() {
            if (this.mediators) {
                return this.mediators.filter((_, i) => i % 2 === 0);
            }
        },
        group2() {
            if (this.mediators) {
                return this.mediators.filter((_, i) => i % 2 === 1);
            }
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
                    this.beginningMediation = true;
                    const mediatorIds = this.mediators.map(m => m._id);
                    const veto = await this.$http.executePost(`/vetoes/beginMediation/${this.selectedVeto.id}`, { mediatorIds, reasons: this.selectedVeto.reasons }, e);

                    this.commitVeto(veto, 'Started veto mediation');
                    this.beginningMediation = false;
                }
            }
        },
        async selectMediators (e) {
            let excludeUsers = this.excludeUsers.split(',');

            for (let i = 0; i < excludeUsers.length; i++) {
                excludeUsers[i] = excludeUsers[i].trim().toLowerCase();
            }

            excludeUsers.push(this.selectedVeto.beatmapMapper.toLowerCase(), this.selectedVeto.vetoer.username.toLowerCase());

            const result = await this.$http.executePost(`/vetoes/selectMediators/${this.selectedVeto.id}`, { mode: this.selectedVeto.mode, excludeUsers }, e);

            if (result && !result.error) {
                this.mediators = result;
            }
        },
    },
};
</script>