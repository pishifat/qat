<template>
    <div class="mb-2">
        <div
            ref="messagesScroll"
            class="chatroom-messages card"
        >
            <div
                v-for="(message, i) in selectedVeto.chatroomMessages"
                :key="i"
                class="card card-body mb-2 bg-primary"
                :class="message.role === 'system' ? 'card-bg-system' : message.role === 'moderator' ? 'card-bg-nat' : 'card-bg-user'"
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
                                :class="message.role === 'vetoer' ? 'text-warning' : message.role === 'voucher' ? 'text-probation' : ''"
                            />
                        </b>
                        <b
                            v-else
                            :class="message.role === 'vetoer' ? 'text-warning' : message.role === 'voucher' ? 'text-probation' : ''"
                        >{{ message.role === 'system' ? 'BN website' : `Anonymous user ${message.userIndex}` }}</b>
                        <i
                            v-if="message.role === 'vetoer'"
                            class="fa-solid fa-gavel text-warning ms-1"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Vetoer"
                        />
                        <i
                            v-else-if="message.role === 'voucher'"
                            class="fa-solid fa-hand text-probation ms-1"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Vouching user"
                        />
                        <b data-bs-toggle="tooltip" data-bs-placement="top" :title="toStandardDetailedDate(message.date)">
                            — {{ toRelativeDate(message.date) }}
                        </b>
                        <button
                            v-if="message.role !== 'system' && loggedInUser?.isNat"
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

        <div v-if="selectedVeto.status != 'archive'">
            <div class="card card-body">
                <textarea
                    id="messageInput"
                    v-model="messageInput"
                    class="form-control"
                    maxlength="5000"
                    :placeholder="isChatroomUser || loggedInUser?.isNat ? 'type here...' : `if you were part of the discussion, you would be able to type here...`"
                    rows="2"
                    :disabled="!isChatroomUser && !loggedInUser?.isNat"
                />
                <b v-if="messageInput && messageInput.length > 4500" :class="messageInput.length == 5000 ? 'text-danger' : messageInput.length > 4500 ? 'text-warning' : 'text-secondary'">{{ messageInput.length }}</b>
                <div>
                    <button
                        class="btn btn-danger w-100 btn-sm mt-1"
                        :disabled="!isChatroomUser && !loggedInUser?.isNat"
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
            refreshIntervalId: null,
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
        ]),
        disableRevealUsernameButton() {
            return this.isChatroomUserPublic || !this.isChatroomUser;
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

        this.startRefreshInterval();
        document.addEventListener('visibilitychange', this.onVisibilityChange);
    },
    beforeUnmount () {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        this.stopRefreshInterval();
    },
    methods: {
        startRefreshInterval () {
            this.stopRefreshInterval();
            this.refreshIntervalId = setInterval(this.refreshVeto, 30 * 1000);
        },
        stopRefreshInterval () {
            if (this.refreshIntervalId != null) {
                clearInterval(this.refreshIntervalId);
                this.refreshIntervalId = null;
            }
        },
        onVisibilityChange () {
            if (document.visibilityState === 'visible') {
                this.refreshVeto();
                this.startRefreshInterval();
            } else {
                this.stopRefreshInterval();
            }
        },
        async refreshVeto () {
            if (this.selectedVeto?.status !== 'chatroom') return;

            const data = await this.$http.executeGet(`/vetoes/refreshVeto/${this.selectedVeto.id}`);

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
            }
        },
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
        async deleteMessage (messageId, e) {
            if (!confirm('Delete this message?')) return;

            const data = await this.$http.executePost(`/vetoes/deleteMessage/${this.selectedVeto.id}`, { messageId }, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
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
    padding: 1rem;
    border: 0px;
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
.text-warning :deep(a) {
    color: var(--bs-warning);
}
</style>