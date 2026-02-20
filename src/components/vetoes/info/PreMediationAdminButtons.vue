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
        <div>
            Users in this chatroom:
            <ul>
                <li v-for="user in selectedVeto.chatroomUsers" :key="user.id">
                    <user-link
                        :username="user.username"
                        :osu-id="user.osuId"
                    />
                    <span v-if="!selectedVeto.chatroomUsersPublic.map(u => u.id).includes(user.id)">(anonymous)</span>
                    <a
                        v-if="confirmDelete != user.id"
                        href="#"
                        class="text-danger small"
                        @click.prevent="confirmDelete = user.id"
                    >
                        remove user from chatroom
                    </a>
                    <a
                        v-else
                        class="text-danger small"
                        href="#"
                        @click.prevent="removeUserFromChatroom(user.id, $event)"
                    >
                        confirm
                    </a>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import UserLink from '../../UserLink.vue';

export default {
    name: 'PreMediationAdminButtons',
    components: {
        UserLink,
    },
    data() {
        return {
            confirmDelete: '',
        };
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
            const data = await this.$http.executePost(`/vetoes/removeUserFromChatroom/${this.selectedVeto.id}`, { userId }, e);

            if (this.$http.isValid(data)) {
                this.$store.commit('vetoes/updateVeto', data.veto);
                this.confirmDelete = '';
            }
        },
    },
};
</script>