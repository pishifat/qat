<template>
    <section v-if="room.viewerCanModerate" class="card card-body">
        <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
            <h4>NAT moderation</h4>
            <button
                class="btn btn-sm"
                :class="room.isLocked ? 'btn-success' : 'btn-danger'"
                :disabled="isSubmitting"
                @click="$emit(room.isLocked ? 'unlock' : 'lock', $event)"
            >
                {{ room.isLocked ? 'Unlock chatroom' : 'Lock chatroom' }}
            </button>
        </div>

        <div class="small text-secondary mb-3">
            Add participants by username or osu! id. Users listed as public will have their identity shown in messages.
        </div>

        <input
            v-model="participantIdentifiers"
            class="form-control mb-2"
            type="text"
            placeholder="Private participants..."
        >
        <input
            v-model="publicParticipantIdentifiers"
            class="form-control mb-2"
            type="text"
            placeholder="Public participants..."
        >
        <div>
            <button
                class="btn btn-sm btn-secondary"
                :disabled="isSubmitting || !canSubmitParticipants"
                @click="submitParticipants($event)"
            >
                Add participants
            </button>
        </div>

        <div class="mt-3">
            Users in this chatroom:
            <data-table v-if="room.participants?.length" :headers="['User', 'Anon name', 'Role', 'Status', 'Actions']" class="mt-1 mb-0">
                <tr v-for="participant in room.participants || []" :key="participant.id">
                    <td>
                        <user-link
                            :username="participant.username"
                            :osu-id="participant.osuId"
                        />
                    </td>
                    <td class="text-center">
                        <code>{{ participant.anonName }}</code>
                    </td>
                    <td class="text-center">
                        <span
                            v-if="participant.role === 'vetoer'"
                            class="text-warning me-1"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Vetoer"
                        >
                            <i class="fa-solid fa-gavel" />
                        </span>
                        <span
                            v-if="participant.role === 'voucher'"
                            class="text-probation"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Vouching user"
                        >
                            <i class="fa-solid fa-hand" />
                        </span>
                        <span v-if="participant.role !== 'vetoer' && participant.role !== 'voucher'" class="text-muted">
                            —
                        </span>
                    </td>
                    <td class="text-center">
                        <span
                            v-if="publicParticipantIds.includes(participant.id)"
                            class="text-success"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Username revealed"
                        >
                            <i class="fa-solid fa-user" />
                        </span>
                        <span
                            v-else
                            class="text-secondary"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Anonymous"
                        >
                            <i class="fa-solid fa-user-secret" />
                        </span>
                    </td>
                    <td class="text-center">
                        <button
                            type="button"
                            class="btn btn-sm btn-link text-danger p-0"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Remove user from chatroom"
                            :disabled="isSubmitting"
                            @click="$emit('remove-participant', participant.id, $event)"
                        >
                            <i class="fa-solid fa-user-minus" />
                        </button>
                    </td>
                </tr>
            </data-table>
            <div v-else class="text-secondary">
                No participants loaded.
            </div>
        </div>
    </section>
</template>

<script>
import DataTable from '../DataTable.vue';
import UserLink from '../UserLink.vue';

export default {
    name: 'ChatroomModeratorControls',
    components: {
        DataTable,
        UserLink,
    },
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
    emits: ['lock', 'unlock', 'add-participants', 'remove-participant'],
    data() {
        return {
            participantIdentifiers: '',
            publicParticipantIdentifiers: '',
        };
    },
    computed: {
        canSubmitParticipants() {
            return this.participantIdentifiers.trim() || this.publicParticipantIdentifiers.trim();
        },
        publicParticipantIds() {
            return (this.room.publicParticipants || []).map(user => user.id);
        },
    },
    methods: {
        submitParticipants(e) {
            const participantIdentifiers = this.participantIdentifiers
                .split(',')
                .map(value => value.trim())
                .filter(Boolean);
            const publicParticipantIdentifiers = this.publicParticipantIdentifiers
                .split(',')
                .map(value => value.trim())
                .filter(Boolean);

            this.$emit('add-participants', {
                participantIdentifiers,
                publicParticipantIdentifiers,
                event: e,
            });

            this.participantIdentifiers = '';
            this.publicParticipantIdentifiers = '';
        },
    },
};
</script>
