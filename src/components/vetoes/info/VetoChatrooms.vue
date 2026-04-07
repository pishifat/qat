<template>
    <div v-if="selectedVeto" class="mt-3">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
            <div>
                <h4 class="mb-0">Chatrooms</h4>
            </div>
            <button v-if="!showChatroomPhaseNotice" type="button" class="btn btn-sm btn-outline-secondary" :disabled="loadingRooms" @click="fetchRooms">
                Refresh
            </button>
        </div>

        <div v-if="loadingRooms" class="text-center py-3">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
        <div v-else>
            <div v-if="listError" class="alert alert-danger">
                {{ listError }}
            </div>

            <div v-else-if="showChatroomPhaseNotice" class="text-secondary">
                The veto is currently being discussed between the mapper(s) and Beatmap Nominators. If a conclusion can't be reached, a larger vote will be held!
            </div>

            <div v-else-if="!roomSummaries.length" class="text-secondary">
                No chatrooms yet.
            </div>

            <div v-if="roomSummaries.length" class="row">
                <div
                    v-for="room in roomSummaries"
                    :key="room.id"
                    class="col-md-12 col-lg-6 my-2"
                >
                    <router-link
                        :to="`/chatrooms/${room.id}`"
                        class="card card-individual text-decoration-none text-body h-100"
                    >
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <b class="text-break">{{ room.name }}</b>
                                <span class="badge" :class="room.isPublic ? 'text-bg-info' : 'text-bg-secondary'">
                                    {{ room.isPublic ? 'Public' : 'Private' }}
                                </span>
                            </div>
                            <div class="small text-secondary mb-2">
                                {{ room.participantCount }} participant{{ room.participantCount === 1 ? '' : 's' }}
                            </div>
                            <div class="d-flex gap-1 flex-wrap">
                                <span class="badge" :class="room.isLocked ? 'text-bg-secondary' : 'text-bg-success'">
                                    {{ room.isLocked ? 'Locked' : 'Active' }}
                                </span>
                            </div>
                        </div>
                    </router-link>
                </div>
            </div>

            <template v-if="loggedInUser?.isNat && selectedVeto?.status === 'archive'">
                <button
                    type="button"
                    class="btn btn-sm w-100 btn-secondary mb-2"
                    data-bs-toggle="collapse"
                    :data-bs-target="'#veto-post-mediation-chatroom-' + selectedVeto.id"
                >
                    Post-mediation chatroom <i class="fas fa-angle-down" />
                </button>
                <div
                    :id="'veto-post-mediation-chatroom-' + selectedVeto.id"
                    class="collapse"
                >
                    <div class="card card-body mb-2">
                        <p class="small text-secondary mb-2">
                            Archived vetoes only. Adds the vetoer, vouching users, and mapper automatically; include any other users below.
                        </p>
                        <input
                            v-model="postMediationIncludeUsers"
                            class="form-control form-control-sm mb-2"
                            type="text"
                            placeholder="Extra participants (username or osu! id, comma-separated)"
                        >
                        <input
                            v-model="postMediationName"
                            class="form-control form-control-sm mb-2"
                            type="text"
                            placeholder="Optional custom room name"
                        >
                        <div class="form-check mb-2">
                            <input
                                :id="'veto-pm-chatroom-public-' + selectedVeto.id"
                                v-model="postMediationIsPublic"
                                class="form-check-input"
                                type="checkbox"
                            >
                            <label class="form-check-label" :for="'veto-pm-chatroom-public-' + selectedVeto.id">
                                Public room (any logged-in user can view)
                            </label>
                        </div>
                        <button
                            type="button"
                            class="btn btn-sm btn-primary"
                            :disabled="postMediationSubmitting"
                            @click="createPostMediationChatroom($event)"
                        >
                            Create post-mediation chatroom
                        </button>
                    </div>
                </div>
            </template>
        </div>

    </div>
</template>

<script>
import Axios from 'axios';
import { mapGetters, mapState } from 'vuex';
import chatroomsModule from '../../../store/chatrooms';

export default {
    name: 'VetoChatrooms',
    data() {
        return {
            loadingRooms: false,
            listError: null,
            postMediationIncludeUsers: '',
            postMediationName: '',
            postMediationIsPublic: false,
            postMediationSubmitting: false,
        };
    },
    computed: {
        ...mapState(['loggedInUser']),
        ...mapGetters('vetoes', ['selectedVeto', 'isChatroomUser']),
        ...mapGetters('chatrooms', ['roomsForTarget']),
        roomSummaries() {
            if (!this.selectedVeto?.id) return [];
            return this.roomsForTarget('veto', this.selectedVeto.id);
        },
        showChatroomPhaseNotice() {
            return this.selectedVeto?.status === 'chatroom' && !this.isChatroomUser && !this.loggedInUser?.isNat;
        },
    },
    watch: {
        'selectedVeto.id': {
            handler() {
                this.fetchRooms();
            },
            immediate: true,
        },
    },
    beforeCreate() {
        if (!this.$store.hasModule('chatrooms')) {
            this.$store.registerModule('chatrooms', chatroomsModule);
        }
    },
    methods: {
        setRooms(rooms) {
            this.$store.commit('chatrooms/setRoomsForTarget', {
                type: 'veto',
                targetId: this.selectedVeto.id,
                rooms,
            });
        },
        async fetchRooms() {
            if (!this.selectedVeto?.id) return;

            this.loadingRooms = true;
            this.listError = null;

            try {
                const { data } = await Axios.get('/api/v2/chatrooms', {
                    params: {
                        type: 'veto',
                        targetId: this.selectedVeto.id,
                    },
                });

                if (data.chatrooms) {
                    this.setRooms(data.chatrooms);
                } else {
                    this.listError = data.error || 'Could not load chatrooms.';
                }
            } catch (error) {
                this.listError = 'Could not load chatrooms.';
            } finally {
                this.loadingRooms = false;
            }
        },
        async createPostMediationChatroom(e) {
            if (!this.selectedVeto?.id || !confirm('Create a new post-mediation chatroom for this archived veto?')) return;

            this.postMediationSubmitting = true;
            try {
                const data = await this.$http.executePost(
                    `/v2/vetoes/${this.selectedVeto.id}/chatrooms/post-mediation`,
                    {
                        includeUsers: this.postMediationIncludeUsers,
                        name: this.postMediationName.trim() || undefined,
                        isPublic: this.postMediationIsPublic,
                    },
                    e
                );

                if (this.$http.isValid(data) && data.chatroom) {
                    if (data.veto) {
                        this.$store.commit('vetoes/updateVeto', data.veto);
                    }
                    if (this.$store.hasModule('chatrooms')) {
                        this.$store.commit('chatrooms/addRoomToTarget', {
                            type: 'veto',
                            targetId: this.selectedVeto.id,
                            room: data.chatroom,
                        });
                        this.$store.commit('chatrooms/setRoom', data.chatroom);
                    }
                    this.postMediationIncludeUsers = '';
                    this.postMediationName = '';
                    this.postMediationIsPublic = false;
                    await this.fetchRooms();
                }
            } finally {
                this.postMediationSubmitting = false;
            }
        },
    },
};
</script>

<style scoped>
.card-individual {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.card-individual:hover {
    transform: translateY(-2px);
}
</style>
