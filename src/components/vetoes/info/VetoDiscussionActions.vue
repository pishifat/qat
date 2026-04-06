<template>
    <section v-if="selectedVeto?.status == 'chatroom'" class="card card-body">
        <div class="row mt-2">
            <div class="col-sm-6">
                <button
                    class="btn w-100 btn-sm"
                    :class="disableRequestMediationButton ? 'btn-secondary' : 'btn-danger'"
                    :disabled="disableRequestMediationButton"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    :title="isChatroomMediationRequestedUser ? 'you already requested mediation!' : !vetoMediationAvailable ? `this option will be available after ${cutoffDate.toLocaleString()}` : isVetoer || isVouchingUser ? 'between the veto-er and the vouching users, 2 people must request mediation!' : isMapper ? 'this will end the discussion and move to a larger vote!' : 'only the mapset host, vetoer, and vouching user can request mediation'"
                    @click="requestMediation($event)"
                >
                    Request veto mediation <span v-if="isVouchingUser || isVetoer">({{ selectedVeto.chatroomMediationRequestedUsers ? selectedVeto.chatroomMediationRequestedUsers.length : '0' }}/2)</span>
                </button>
            </div>
        </div>

        <hr>

        <div>
            <b>Vote to dismiss veto</b>
            <ul>
                <li>The mapset host can start a vote to dismiss the veto without mediation.</li>
                <li>
                    This vote includes...
                    <ul>
                        <li>The veto's creator</li>
                        <li>Users who vouched for the veto</li>
                    </ul>
                </li>
                <li>If the majority votes to <b>uphold the veto</b>, discussion will continue. The mapset host can start a new vote any time afterwards.</li>
                <li>If the majority votes to <b>dismiss the veto</b>, the discussion will end. The veto will be dismissed after the NAT reviews the discussion.</li>
                <li>If someone is unresponsive and doesn't vote, contact the NAT.</li>
            </ul>
        </div>

        <div class="row mt-2">
            <div class="col-sm-6">
                <button
                    class="btn w-100 btn-sm"
                    :class="disableStartVoteButton ? 'btn-secondary' : 'btn-danger'"
                    :disabled="disableStartVoteButton"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    :title="selectedVeto.chatroomVoteEnabled ? 'a vote is already in progress!' : isMapper ? `start a vote based on your map's most recent changes` : 'only the mapper can do this!'"
                    @click="startVote($event)"
                >
                    Start vote to dismiss veto
                </button>
            </div>
            <div class="col-sm-3">
                <button
                    class="btn w-100 btn-sm"
                    :class="disableUpholdVoteButton ? 'btn-secondary' : 'btn-danger'"
                    :disabled="disableUpholdVoteButton"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    :title="isChatroomUpholdVoter ? 'you already voted' : isVetoerOrVouchingUser && disableUpholdVoteButton ? `the mapper must begin the vote!` : isVetoerOrVouchingUser ? 'uphold = map needs more changes' : 'only the veto creator and vouching users can vote'"
                    @click="vote('uphold', $event)"
                >
                    Vote to uphold
                </button>
            </div>
            <div class="col-sm-3">
                <button
                    class="btn w-100 btn-sm"
                    :class="disableDismissVoteButton ? 'btn-secondary' : 'btn-danger'"
                    :disabled="disableDismissVoteButton"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    :title="isChatroomDismissVoter ? 'you already voted' : isVetoerOrVouchingUser && disableDismissVoteButton ? `the mapper must begin the vote!` : isVetoerOrVouchingUser ? 'dismiss = map is acceptable' : 'only the veto creator and vouching users can vote'"
                    @click="vote('dismiss', $event)"
                >
                    Vote to dismiss
                </button>
            </div>
        </div>
    </section>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'VetoDiscussionActions',
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
            'isChatroomUser',
            'isVouchingUser',
            'isVetoer',
            'isMapper',
            'isChatroomMediationRequestedUser',
            'isChatroomUpholdVoter',
            'isChatroomDismissVoter',
        ]),
        cutoffDate() {
            return this.$moment(this.selectedVeto.chatroomInitiated).add(1, 'day');
        },
        vetoMediationAvailable() {
            if (this.isChatroomMediationRequestedUser) {
                return false;
            }

            return new Date > this.cutoffDate;
        },
        disableRequestMediationButton() {
            return (!this.isVetoer && !this.isVouchingUser && !this.isMapper) || !this.vetoMediationAvailable || !this.isChatroomUser;
        },
        isVetoerOrVouchingUser() {
            return this.isVetoer || this.isVouchingUser;
        },
        disableUpholdVoteButton() {
            return !this.isVetoerOrVouchingUser || !this.selectedVeto.chatroomVoteEnabled || this.isChatroomUpholdVoter;
        },
        disableDismissVoteButton() {
            return !this.isVetoerOrVouchingUser || !this.selectedVeto.chatroomVoteEnabled || this.isChatroomDismissVoter;
        },
        disableStartVoteButton() {
            return !this.isMapper || this.selectedVeto.chatroomVoteEnabled;
        },
    },
    methods: {
        async requestMediation(e) {
            if (confirm('Are you sure?')) {
                const data = await this.$http.executePost(`/vetoes/requestMediation/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
        async startVote(e) {
            if (confirm(`Are you sure?\n\nEveryone needs to know which version of the map to vote on. If this is understood, feel free to start the vote.`)) {
                const data = await this.$http.executePost(`/vetoes/startVote/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
        async vote(vote, e) {
            if (confirm('Are you sure?')) {
                const data = await this.$http.executePost(`/vetoes/vote/${this.selectedVeto.id}`, { vote }, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
    },
};
</script>
