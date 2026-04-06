<template>
    <div v-if="room" class="row">
        <div class="col-md-12">
            <section class="card card-body">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div>
                        <h5 class="mb-0">{{ room.name }}</h5>
                        <div class="small text-secondary">
                            {{ room.participantCount }} participant{{ room.participantCount === 1 ? '' : 's' }}
                        </div>
                    </div>
                    <router-link
                        v-if="backTo"
                        :to="backTo"
                        class="btn btn-sm btn-outline-secondary"
                    >
                        Back
                    </router-link>
                </div>
            </section>

            <chatroom-thread
                :room="room"
                :refresh-meta="refreshMeta"
                @refresh="refreshRoom"
                @delete-message="deleteMessage"
                @restore-message="restoreMessage"
            />

            <chatroom-composer
                ref="composer"
                :room="room"
                :is-submitting="isSubmitting"
                @submit-message="submitMessage"
                @reveal-self="revealSelf"
            />

            <chatroom-moderator-controls
                v-if="room.viewerCanModerate"
                :room="room"
                :is-submitting="isSubmitting"
                @lock="lockRoom"
                @unlock="unlockRoom"
                @add-participants="addParticipants"
                @remove-participant="removeParticipant"
            />
        </div>
    </div>
</template>

<script>
import Axios from 'axios';
import { mapGetters } from 'vuex';
import ChatroomThread from './ChatroomThread.vue';
import ChatroomComposer from './ChatroomComposer.vue';
import ChatroomModeratorControls from './ChatroomModeratorControls.vue';

export default {
    name: 'ChatroomPanel',
    components: {
        ChatroomThread,
        ChatroomComposer,
        ChatroomModeratorControls,
    },
    props: {
        roomId: {
            type: String,
            required: true,
        },
        backTo: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            isSubmitting: false,
            isPolling: false,
            refreshIntervalId: null,
        };
    },
    computed: {
        ...mapGetters('chatrooms', ['roomById', 'roomRefreshMeta']),
        room() {
            return this.roomById(this.roomId);
        },
        refreshMeta() {
            return this.roomRefreshMeta(this.roomId);
        },
    },
    async mounted() {
        await this.refreshRoom();
        this.startRefreshInterval();
        document.addEventListener('visibilitychange', this.onVisibilityChange);
    },
    beforeUnmount() {
        this.stopRefreshInterval();
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
    },
    methods: {
        setRefreshMeta(patch) {
            this.$store.commit('chatrooms/setRoomRefreshMeta', {
                roomId: this.roomId,
                patch,
            });
        },
        commitRoom(chatroom) {
            this.$store.commit('chatrooms/setRoom', chatroom);
            this.setRefreshMeta({
                isRefreshing: false,
                lastError: null,
                lastRefreshedAt: new Date(),
            });
        },
        startRefreshInterval() {
            this.stopRefreshInterval();
            this.refreshIntervalId = setInterval(() => {
                this.refreshRoom();
            }, 30 * 1000);
        },
        stopRefreshInterval() {
            if (this.refreshIntervalId != null) {
                clearInterval(this.refreshIntervalId);
                this.refreshIntervalId = null;
            }
        },
        onVisibilityChange() {
            if (document.visibilityState === 'visible') {
                this.refreshRoom();
                this.startRefreshInterval();
            } else {
                this.stopRefreshInterval();
            }
        },
        async refreshRoom() {
            if (this.isPolling) return;

            this.isPolling = true;
            this.setRefreshMeta({ isRefreshing: true, lastError: null });

            try {
                const { data } = await Axios.get(`/api/v2/chatrooms/${this.roomId}`);
                if (data.chatroom) {
                    this.commitRoom(data.chatroom);
                } else {
                    this.setRefreshMeta({
                        isRefreshing: false,
                        lastError: data.error || 'Refresh failed.',
                    });
                }
            } catch (error) {
                this.setRefreshMeta({
                    isRefreshing: false,
                    lastError: 'Refresh failed.',
                });
            } finally {
                this.isPolling = false;
            }
        },
        async runMutation(callback) {
            if (this.isSubmitting) return;

            this.isSubmitting = true;
            try {
                const data = await callback();
                if (this.$http.isValid(data) && data.chatroom) {
                    this.commitRoom(data.chatroom);
                }
                return data;
            } finally {
                this.isSubmitting = false;
            }
        },
        async submitMessage(content, e) {
            const data = await this.runMutation(async () => {
                return await this.$http.executePost(`/v2/chatrooms/${this.roomId}/messages`, { content }, e);
            });

            if (this.$http.isValid(data) && data.chatroom) {
                this.$refs.composer.clearMessage();
            }
        },
        async revealSelf(e) {
            if (!confirm('Reveal your identity for future messages?')) return;

            await this.runMutation(async () => {
                return await this.$http.executePost(`/v2/chatrooms/${this.roomId}/reveal-self`, {}, e);
            });
        },
        async lockRoom(e) {
            await this.runMutation(async () => {
                return await this.$http.executePost(`/v2/chatrooms/${this.roomId}/lock`, {}, e);
            });
        },
        async unlockRoom(e) {
            await this.runMutation(async () => {
                return await this.$http.executePost(`/v2/chatrooms/${this.roomId}/unlock`, {}, e);
            });
        },
        async addParticipants({ participantIdentifiers, publicParticipantIdentifiers, event }) {
            await this.runMutation(async () => {
                return await this.$http.executePost(`/v2/chatrooms/${this.roomId}/participants/add`, {
                    participantIdentifiers,
                    publicParticipantIdentifiers,
                }, event);
            });
        },
        async removeParticipant(userId, e) {
            if (!confirm('Remove this user from the chatroom?')) return;

            await this.runMutation(async () => {
                return await this.$http.executePost(`/v2/chatrooms/${this.roomId}/participants/remove`, {
                    userId,
                }, e);
            });
        },
        async deleteMessage(messageId, e) {
            if (!confirm('Delete this message?')) return;

            await this.runMutation(async () => {
                return await this.$http.executePost(`/v2/chatrooms/${this.roomId}/messages/${messageId}/delete`, {}, e);
            });
        },
        async restoreMessage(messageId, e) {
            await this.runMutation(async () => {
                return await this.$http.executePost(`/v2/chatrooms/${this.roomId}/messages/${messageId}/restore`, {}, e);
            });
        },
    },
};
</script>
