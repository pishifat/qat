<template>
    <section class="card card-body">
        <textarea
            v-model="messageInput"
            class="form-control"
            maxlength="5000"
            rows="3"
            :placeholder="room.viewerCanPost ? 'Type here...' : room.isLocked ? 'This chatroom is locked.' : 'You cannot post in this chatroom.'"
            :disabled="!room.viewerCanPost || isSubmitting"
        />
        <b
            v-if="messageInput && messageInput.length > 4500"
            :class="messageInput.length === 5000 ? 'text-danger' : 'text-warning'"
        >{{ messageInput.length }}</b>
        <div class="d-flex flex-wrap gap-2 mt-2 w-100">
            <button
                class="btn btn-sm btn-secondary flex-fill"
                :disabled="!room.viewerCanPost || !messageInput.trim() || isSubmitting"
                @click="submitMessage($event)"
            >
                Submit message
            </button>
            <button
                v-if="room.viewerCanRevealSelf"
                class="btn btn-sm btn-warning flex-fill"
                :disabled="isSubmitting"
                @click="$emit('reveal-self', $event)"
            >
                Reveal your identity
            </button>
        </div>
    </section>
</template>

<script>
export default {
    name: 'ChatroomComposer',
    props: {
        room: {
            type: Object,
            required: true,
        },
        isSubmitting: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['submit-message', 'reveal-self'],
    data() {
        return {
            messageInput: '',
        };
    },
    methods: {
        submitMessage(e) {
            this.$emit('submit-message', this.messageInput, e);
        },
        clearMessage() {
            this.messageInput = '';
        },
    },
};
</script>
