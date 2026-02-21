<template>
    <div class="mb-2">
        <div
            ref="messagesScroll"
            class="chatroom-messages"
        >
            <div
                v-for="(message, i) in selectedVeto.chatroomMessages"
                :key="i"
                class="card card-body mb-2"
                :class="message.isSystem ? 'card-bg-system' : message.isModerator ? 'card-bg-nat' : 'card-bg-user'"
            >
                <div class="card-message-header">
                    <img
                        v-if="message.user"
                        :src="'https://a.ppy.sh/' + message.user.osuId"
                        class="card-avatar-img"
                        alt=""
                    >
                    <div>
                        <b v-if="message.user">
                            <user-link
                                :username="message.user.username"
                                :osu-id="message.user.osuId"
                            />
                        </b>
                        <b v-else>{{ message.isSystem ? 'BN website' : `Anonymous user ${message.userIndex}` }}</b> —
                        <b data-bs-toggle="tooltip" data-bs-placement="top" :title="toStandardDetailedDate(message.date)">
                            {{ toRelativeDate(message.date) }}
                        </b>
                        <button
                            v-if="!message.isSystem && loggedInUser.isNat"
                            type="button"
                            class="btn btn-sm btn-link text-danger p-0 ms-1"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Delete message"
                            @click="deleteMessage(message._id.toString(), $event)"
                        >
                            <i class="fa-solid fa-trash" />
                        </button>
                    </div>
                </div>
                <div v-html="$md.render(message.content)" />
            </div>
        </div>

        <div>
            <div class="card card-body">
                <textarea
                    id="messageInput"
                    v-model="messageInput"
                    class="form-control"
                    maxlength="5000"
                    :placeholder="isChatroomUser || loggedInUser.isNat ? 'type here...' : `if you were part of the discussion, you would be able to type here...`"
                    rows="2"
                    :disabled="!isChatroomUser && !loggedInUser.isNat"
                />
                <b v-if="messageInput && messageInput.length > 4500" :class="messageInput.length == 5000 ? 'text-danger' : messageInput.length > 4500 ? 'text-warning' : 'text-secondary'">{{ messageInput.length }}</b>
                <div>
                    <button
                        class="btn btn-danger w-100 btn-sm mt-1"
                        :disabled="!isChatroomUser && !loggedInUser.isNat"
                        @click="saveMessage($event)"
                    >
                        Submit post
                    </button>
                </div>
                <div class="row mt-2">
                    <div class="col-sm-6">
                        <button
                            class="btn w-100 btn-sm"
                            :class="disableRevealUsernameButton ? 'btn-secondary' : 'btn-danger'"
                            :disabled="disableRevealUsernameButton"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            :title="isChatroomUserPublic ? 'your username is already revealed!' : 'your future posts will not be anonymous!'"
                            @click="revealUsername($event)"
                        >
                            Reveal your username
                        </button>
                    </div>
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
                        <li>This vote includes...</li>
                        <ul>
                            <li>The veto's creator</li>
                            <li>Users who vouched for the veto</li>
                        </ul>
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
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserLink from '../../UserLink.vue';
export default {
    name: 'Chatroom',
    components: {
        UserLink,
    },
    data() {
        return {
            messageInput: '',
            initialScrollDone: false,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
            'isChatroomUser',
            'isChatroomUserPublic',
            'isVouchingUser',
            'isVetoer',
            'isMapper',
            'isChatroomMediationRequestedUser',
            'isChatroomUpholdVoter',
            'isChatroomDismissVoter',
            'alreadyVoted',
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
        disableRevealUsernameButton() {
            return this.isChatroomUserPublic || !this.isChatroomUser;
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
    watch: {
        'selectedVeto.chatroomMessages': {
            handler (messages) {
                if (!messages || messages.length === 0 || this.initialScrollDone) return;
                this.initialScrollDone = true;
                this.scheduleInitialScroll();
            },
            immediate: true,
        },
    },
    mounted () {
        if (this.selectedVeto.chatroomMessages?.length && !this.initialScrollDone) {
            this.initialScrollDone = true;
            this.scheduleInitialScroll();
        }

        setInterval(async () => {
            if (this.selectedVeto.status == 'chatroom') {
                const data = await this.$http.executeGet(`/vetoes/refreshVeto/${this.selectedVeto.id}`);

                if (this.$http.isValid(data)) {
                    this.$store.commit(`vetoes/updateVeto`, data.veto);
                }
            }
        }, 15000);
    },
    methods: {
        scheduleInitialScroll () {
            this.$nextTick(() => this.scrollToBottom());
            setTimeout(() => this.scrollToBottom(), 100);
            setTimeout(() => this.scrollToBottom(), 350);
        },
        scrollToBottom () {
            const el = this.$refs.messagesScroll;
            if (!el) return;

            const scroll = () => {
                el.scrollTop = el.scrollHeight;
            };

            requestAnimationFrame(() => {
                scroll();
                requestAnimationFrame(scroll);
            });
        },
        async saveMessage (e) {
            if (confirm(`Are you sure? You can't edit after it is posted.`)) {
                const data = await this.$http.executePost(`/vetoes/saveMessage/${this.selectedVeto.id}`, { message: this.messageInput }, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                    this.messageInput = '';
                    this.$nextTick(() => this.scrollToBottom());
                }
            }
        },
        async revealUsername (e) {
            if (confirm(`Are you sure?`)) {
                const data = await this.$http.executePost(`/vetoes/revealUsername/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
        async requestMediation (e) {
            if (confirm(`Are you sure?`)) {
                const data = await this.$http.executePost(`/vetoes/requestMediation/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
        async deleteMessage (messageId, e) {
            if (!confirm('Delete this message?')) return;

            const data = await this.$http.executePost(`/vetoes/deleteMessage/${this.selectedVeto.id}`, { messageId }, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
            }
        },
        async startVote (e) {
            if (confirm(`Are you sure?\n\nEveryone needs to know which version of the map to vote on. If this is understood, feel free to start the vote.`)) {
                const data = await this.$http.executePost(`/vetoes/startVote/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
        async vote (vote, e) {
            if (confirm(`Are you sure?`)) {
                const data = await this.$http.executePost(`/vetoes/vote/${this.selectedVeto.id}`, { vote }, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
    },
};
</script>

<style scoped>
.chatroom-messages {
    max-height: 50vh;
    min-height: 200px;
    overflow-y: auto;
    margin-bottom: 1rem;
}
.card-bg-system {
    background-image: url('/images/nat.png');
    background-repeat: repeat-y;
    background-position: left;
    background-blend-mode: saturation;
}
.card-bg-nat {
    background-image: url('/images/nat.png');
    background-repeat: repeat-y;
    background-position: left;
}
.card-bg-user {
    background-image: url('/images/user.png');
    background-repeat: repeat-y;
    background-position: left;
}
.card-message-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}
.card-avatar-img {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    object-fit: cover;
    border-radius: 100%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25, .9);
    background-color: var(--bs-gray-800);
}
</style>