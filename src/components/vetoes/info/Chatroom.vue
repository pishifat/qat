<template>
    <div class="mb-2">
        <div
            v-for="(message, i) in selectedVeto.chatroomMessages"
            :key="i"
            class="card card-body mb-2"
            :class="message.isSystem ? 'card-bg-nat' : 'card-bg-user'"
        >
            <img v-if="message.user" :src="'https://a.ppy.sh/' + message.user.osuId" class="card-avatar-img" />
            <div>
                <b v-if="message.user">
                    <user-link
                        :username="message.user.username"
                        :osu-id="message.user.osuId"
                    />
                </b>
                <b v-else>{{ message.isSystem ? 'BN website' : `Anonymous user ${message.userIndex}` }}</b> — <b>{{ new Date(message.date).toLocaleString() }}</b>
                <span v-if="!message.isSystem && loggedInUser.isNat">
                    <a
                        v-if="confirmDelete != message._id.toString()"
                        href="#"
                        class="text-danger small"
                        @click.prevent="confirmDelete = message._id.toString()"
                    >
                        delete
                    </a>
                    <a
                        v-else
                        class="text-danger small"
                        href="#"
                        @click.prevent="deleteMessage(message._id.toString(), $event)"
                    >
                        confirm
                    </a>
                </span>
            </div>
            <div v-html="$md.render(message.content)" />
        </div>

        <div>
            <div class="card card-body">
                <textarea
                    id="messageInput"
                    v-model="messageInput"
                    class="form-control"
                    maxlength="5000"
                    :placeholder="isChatroomUser ? 'type here...' : `if you were part of the discussion, you would be able to type here...`"
                    rows="2"
                    :disabled="!isChatroomUser"
                />
                <b v-if="messageInput && messageInput.length > 4500" :class="messageInput.length == 5000 ? 'text-danger' : messageInput.length > 4500 ? 'text-warning' : 'text-secondary'">{{ messageInput.length }}</b>
                <div>
                    <button
                        class="btn btn-danger btn-block btn-sm mt-1"
                        @click="saveMessage($event)"
                        :disabled="!isChatroomUser"
                    >
                        Submit post
                    </button>
                </div>
                <div class="row mt-2">
                    <div class="col-sm-6">
                        <button
                            class="btn btn-danger btn-block btn-sm"
                            @click="revealUsername($event)"
                            :disabled="isChatroomUserPublic || !isChatroomUser"
                        >
                            Reveal your username
                        </button>
                    </div>
                    <div class="col-sm-6">
                        <button
                            class="btn btn-danger btn-block btn-sm"
                            @click="requestMediation($event)"
                            :disabled="(!isVetoer && !isVouchingUser && !isMapper) || !vetoMediationAvailable || !isChatroomUser"
                        >
                            Request veto mediation <span v-if="isVouchingUser || isVetoer">({{ selectedVeto.chatroomMediationRequestedUsers ? selectedVeto.chatroomMediationRequestedUsers.length : '0' }}/2)</span>
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
            'isChatroomMediationRequestedUser'
        ]),
        vetoMediationAvailable() {
            if (this.isChatroomMediationRequestedUser) {
                return false;
            }

            const cutoff = this.$moment(this.selectedVeto.chatroomInitiated).add(1, 'day');

            return new Date > cutoff;
        },
    },
    data() {
        return {
            messageInput: '',
            confirmDelete: '',
        };
    },
    mounted () {
        setInterval(async () => {
            const data = await this.$http.executeGet(`/vetoes/refreshVeto/${this.selectedVeto.id}`);

            if (this.$http.isValid(data)) {
                this.$store.commit(`vetoes/updateVeto`, data.veto);
            }
        }, 360000);
    },
    methods: {
        async saveMessage (e) {
            if (confirm(`Are you sure? You can't edit after it is posted.`)) {
                const data = await this.$http.executePost(`/vetoes/saveMessage/${this.selectedVeto.id}`, { message: this.messageInput }, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                    this.messageInput = '';
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
            const data = await this.$http.executePost(`/vetoes/deleteMessage/${this.selectedVeto.id}`, { messageId }, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
            }
        },
    }
};
</script>

<style scoped>
.card-bg-nat {
    background-image: url('/images/nat.png');
    background-repeat: repeat-y;
    background-position: left;
    background-blend-mode: saturation;
}
.card-bg-user {
    background-image: url('/images/user.png');
    background-repeat: repeat-y;
    background-position: left;
}
.card-avatar-img {
    position: absolute;
    top: calc(50% - 30px);
    left: -8px;
    max-width: 24px;
    max-height: 24px;
    object-fit: cover;
    border-radius: 100%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25, .9);
    background-color: var(--gray-dark);
}
</style>