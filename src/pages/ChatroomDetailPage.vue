<template>
    <div class="row">
        <div class="col-md-12">
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border" role="status" />
            </div>
            <div v-else-if="error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2" />
                {{ error }}
            </div>
            <div v-else class="container">
                <chatroom-panel
                    :room-id="roomId"
                    :back-to="backTo"
                />
            </div>
        </div>
        <toast-messages />
    </div>
</template>

<script>
import Axios from 'axios';
import { mapGetters } from 'vuex';
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
    computed: {
        ...mapGetters('chatrooms', ['roomById']),
    },
    beforeCreate() {
        if (!this.$store.hasModule('chatrooms')) {
            this.$store.registerModule('chatrooms', chatroomsModule);
        }
    },
    async mounted() {
        const roomId = this.$route.params.id;
        this.roomId = roomId;

        if (!roomId) {
            this.loading = false;
            this.error = 'Chatroom not found';
            return;
        }

        try {
            const { data } = await Axios.get(`/api/v2/chatrooms/${roomId}`);

            if (!data.chatroom) {
                this.error = data.error || 'Chatroom not found';
                return;
            }

            this.$store.commit('chatrooms/setRoom', data.chatroom);

            if (data.chatroom.type === 'veto' && data.chatroom.targetId) {
                this.backTo = `/vetoes/${data.chatroom.targetId}`;
            }
        } catch (error) {
            this.error = 'Chatroom not found';
        } finally {
            this.loading = false;
        }
    },
};
</script>
