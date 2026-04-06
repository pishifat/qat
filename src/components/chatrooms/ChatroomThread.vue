<template>
    <section class="card card-body">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <span class="badge" :class="room.isPublic ? 'text-bg-info' : 'text-bg-secondary'">
                    {{ room.isPublic ? 'Public room' : 'Participants only' }}
                </span>
                <span v-if="room.isLocked" class="badge text-bg-warning">Locked</span>
            </div>
            <div class="small text-secondary d-flex flex-wrap align-items-center gap-2">
                <span v-if="refreshMeta.isRefreshing">Refreshing...</span>
                <span v-else-if="refreshMeta.lastError" class="text-danger">{{ refreshMeta.lastError }}</span>
                <span v-else>
                    Refreshing in {{ countdownSeconds }}s
                </span>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="$emit('refresh')">
                    Refresh
                </button>
            </div>
        </div>

        <div ref="messagesScroll" class="chatroom-messages">
            <div v-if="!room.messages?.length" class="text-secondary">
                No messages yet.
            </div>
            <chatroom-message-card
                v-for="message in room.messages || []"
                :key="message.id"
                :message="message"
                @delete-message="handleDeleteMessage"
                @restore-message="handleRestoreMessage"
            />
        </div>
    </section>
</template>

<script>
import ChatroomMessageCard from './ChatroomMessageCard.vue';

export default {
    name: 'ChatroomThread',
    components: {
        ChatroomMessageCard,
    },
    props: {
        room: {
            type: Object,
            required: true,
        },
        refreshMeta: {
            type: Object,
            required: true,
        },
        refreshIntervalMs: {
            type: Number,
            default: 30 * 1000,
        },
    },
    emits: ['refresh', 'delete-message', 'restore-message'],
    data() {
        return {
            lastMessageCount: 0,
            now: Date.now(),
            countdownIntervalId: null,
        };
    },
    computed: {
        countdownSeconds() {
            if (!this.refreshMeta.lastRefreshedAt) {
                return Math.ceil(this.refreshIntervalMs / 1000);
            }

            const nextRefreshAt = new Date(this.refreshMeta.lastRefreshedAt).getTime() + this.refreshIntervalMs;
            const remainingMs = Math.max(0, nextRefreshAt - this.now);

            return Math.ceil(remainingMs / 1000);
        },
    },
    watch: {
        'room.messages.length': {
            handler(newLength) {
                if (newLength > this.lastMessageCount) {
                    this.$nextTick(() => this.scrollToBottom());
                }
                this.lastMessageCount = newLength || 0;
            },
            immediate: true,
        },
    },
    mounted() {
        this.countdownIntervalId = setInterval(() => {
            this.now = Date.now();
        }, 1000);
    },
    beforeUnmount() {
        if (this.countdownIntervalId != null) {
            clearInterval(this.countdownIntervalId);
            this.countdownIntervalId = null;
        }
    },
    methods: {
        handleDeleteMessage(messageId, e) {
            this.$emit('delete-message', messageId, e);
        },
        handleRestoreMessage(messageId, e) {
            this.$emit('restore-message', messageId, e);
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
    margin-top: 1rem;
    border: 0;
}
</style>
