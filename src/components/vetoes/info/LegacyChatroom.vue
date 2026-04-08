<template>
    <div class="mb-2">
        <div
            ref="messagesScroll"
            class="chatroom-messages card"
        >
            <div
                v-for="(message, i) in messages"
                :key="messageKey(message, i)"
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
                    </div>
                </div>
                <div v-html="$md.render(message.content)" />
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import UserLink from '../../UserLink.vue';

export default {
    name: 'LegacyChatroom',
    components: {
        UserLink,
    },
    computed: {
        ...mapGetters('vetoes', ['selectedVeto']),
        messages() {
            return this.selectedVeto?.chatroomMessages || [];
        },
    },
    watch: {
        messages: {
            handler() {
                this.$nextTick(() => this.scrollToBottom());
            },
            deep: true,
        },
    },
    mounted() {
        this.$nextTick(() => this.scrollToBottom());
    },
    methods: {
        messageKey(message, i) {
            return message._id || message.id || i;
        },
        scrollToBottom() {
            const el = this.$refs.messagesScroll;
            if (!el) return;
            el.scrollTop = el.scrollHeight;
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
