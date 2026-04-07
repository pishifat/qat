<template>
    <div class="row ">
        <div class="col-md-12">
            <chatroom-panel
                v-if="roomId && !error"
                :room-id="roomId"
                :back-to="backTo"
            />
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border" role="status" />
            </div>
            <div v-if="!loading && error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2" />
                {{ error }}
            </div>
        </div>
        <toast-messages />
    </div>
</template>

<script>
import chatroomsModule from '../store/chatrooms';
import ChatroomPanel from '../components/chatrooms/ChatroomPanel.vue';
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'ChatroomDetailPage',
    components: {
        ChatroomPanel,
        ToastMessages,
    },
    data() {
        return {
            loading: true,
            error: null,
            roomId: null,
            backTo: null,
        };
    },
    beforeCreate() {
        if (!this.$store.hasModule('chatrooms')) {
            this.$store.registerModule('chatrooms', chatroomsModule);
        }
    },
    async mounted() {
        const id = this.$route.params.id;
        if (!id) {
            this.loading = false;
            this.error = 'Chatroom not found';
            return;
        }
        this.roomId = id;
        const data = await this.$http.initialRequest(`/v2/chatrooms/${id}`);
        this.loading = false;
        if (this.$http.isValid(data) && data.chatroom) {
            this.$store.commit('chatrooms/setRoom', data.chatroom);
            if (data.chatroom.type === 'veto' && data.chatroom.targetId) {
                this.backTo = `/vetoes/${data.chatroom.targetId}`;
            }
        } else {
            this.error = data?.error || 'Chatroom not found';
        }
    },
};
</script>
