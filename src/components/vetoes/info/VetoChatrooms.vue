<template>
    <div v-if="selectedVeto" class="card card-body mt-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <div>
                <h4 class="mb-0">Reusable chatrooms</h4>
                <div class="small text-secondary">
                    Generic chatrooms attached to this veto.
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="loadingRooms" @click="fetchRooms">
                Refresh rooms
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

            <div v-if="!roomSummaries.length" class="text-secondary">
                No reusable chatrooms yet.
            </div>

            <div v-else class="row">
                <div
                    v-for="room in roomSummaries"
                    :key="room.id"
                    class="col-md-6 col-lg-4 my-2"
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
                                <span class="badge" :class="room.isLocked ? 'text-bg-warning' : 'text-bg-success'">
                                    {{ room.isLocked ? 'Locked' : 'Open' }}
                                </span>
                                <span v-if="room.viewerCanModerate" class="badge text-bg-danger">
                                    NAT controls
                                </span>
                            </div>
                        </div>
                    </router-link>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import Axios from 'axios';
import { mapGetters } from 'vuex';
import chatroomsModule from '../../../store/chatrooms';

export default {
    name: 'VetoChatrooms',
    data() {
        return {
            loadingRooms: false,
            listError: null,
        };
    },
    computed: {
        ...mapGetters('vetoes', ['selectedVeto']),
        ...mapGetters('chatrooms', ['roomsForTarget']),
        roomSummaries() {
            if (!this.selectedVeto?.id) return [];
            return this.roomsForTarget('veto', this.selectedVeto.id);
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
