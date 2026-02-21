<template>
    <div>
        <hr>
        <b>NAT moderation</b>
        <div class="row mt-2">
            <!-- move to "available" status -->
            <div class="col-sm-6">
                <button
                    class="btn btn-sm btn-danger w-100 mb-2"
                    @click="setStatusAvailable($event)"
                >
                    Move to mediation
                </button>
            </div>

            <!-- move to "archive" status -->
            <div class="col-sm-6">
                <button
                    class="btn btn-sm w-100 btn-danger mb-2"
                    @click="setStatusArchive($event)"
                >
                    Move to archive
                </button>
            </div>
        </div>
        <div class="mt-2">
            Users in this chatroom:
            <data-table :headers="['User', 'Role', 'Status', 'Actions']" class="mt-1 mb-0">
                <tr v-for="user in selectedVeto.chatroomUsers" :key="user.id">
                    <td>
                        <user-link
                            :username="user.username"
                            :osu-id="user.osuId"
                        />
                    </td>
                    <td class="text-center">
                        <span
                            v-if="selectedVeto.vetoer && selectedVeto.vetoer.id === user.id"
                            class="text-warning me-1"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Vetoer"
                        >
                            <i class="fa-solid fa-gavel" />
                        </span>
                        <span
                            v-if="selectedVeto.vouchingUsers && selectedVeto.vouchingUsers.some(u => u.id === user.id)"
                            class="text-info"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Vouching user"
                        >
                            <i class="fa-solid fa-user-check" />
                        </span>
                        <span v-if="!(selectedVeto.vetoer && selectedVeto.vetoer.id === user.id) && !(selectedVeto.vouchingUsers && selectedVeto.vouchingUsers.some(u => u.id === user.id))" class="text-muted">
                            —
                        </span>
                    </td>
                    <td class="text-center">
                        <span
                            v-if="selectedVeto.chatroomUsersPublic.map(u => u.id).includes(user.id)"
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
                            @click="removeUserFromChatroom(user.id, $event)"
                        >
                            <i class="fa-solid fa-user-minus" />
                        </button>
                    </td>
                </tr>
            </data-table>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import UserLink from '../../UserLink.vue';
import DataTable from '../../DataTable.vue';

export default {
    name: 'PreMediationAdminButtons',
    components: {
        UserLink,
        DataTable,
    },
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
    },
    methods: {
        async setStatusAvailable (e) {
            if (confirm(`Are you sure?`)) {
                const data = await this.$http.executePost(`/vetoes/setStatusAvailable/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
        async setStatusArchive (e) {
            if (confirm(`Are you sure?`)) {
                const data = await this.$http.executePost(`/vetoes/setStatusArchive/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
        async removeUserFromChatroom (userId, e) {
            if (!confirm('Remove this user from the chatroom?')) return;

            const data = await this.$http.executePost(`/vetoes/removeUserFromChatroom/${this.selectedVeto.id}`, { userId }, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
            }
        },
    },
};
</script>