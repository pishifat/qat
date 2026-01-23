<template>
    <div class="mb-2">
        <div>
            If you want this veto to take effect, you can anonymously <b>vouch for it below!</b>
        </div>
        <div class="small text-secondary">Only members of the BN can vouch. By supporting the veto this way, you will be part of an anonymized discussion with the mapper. NAT members are responsible for moderation.</div>
        <button
            class="btn btn-sm btn-danger mt-2"
            @click="vouch(true, null, $event)"
            :disabled="loggedInUser.isNat || isVetoer"
        >
            {{ isVouchingUser ? 'Remove your support for this veto' : 'I vouch for this veto!' }}
        </button>

        <div v-if="loggedInUser.isNat && loggedInUser.id != selectedVeto.vetoer.id" class="text-secondary small mt-3">
            <div><b>NAT-only information</b></div>
            <ul>
                <li>
                    Mapper: 
                    <user-link
                        :username="selectedVeto.beatmapMapper"
                        :osu-id="selectedVeto.beatmapMapperId"
                    />
                </li>
                <li>
                    Vetoer: 
                    <user-link
                        :username="selectedVeto.vetoer.username"
                        :osu-id="selectedVeto.vetoer.osuId"
                    />
                </li>
                <li>
                    Vouching users:
                    <ul>
                        <li v-if="!selectedVeto.vouchingUsers || !selectedVeto.vouchingUsers.length">None</li>
                        <li v-for="user in selectedVeto.vouchingUsers" :key="user.id">
                            <user-link
                                :username="user.username"
                                :osu-id="user.osuId"
                            />
                            <a
                                v-if="confirmDelete != user.id"
                                href="#"
                                class="text-danger small"
                                @click.prevent="confirmDelete = user.id"
                            >
                                delete
                            </a>
                            <a
                                v-else
                                class="text-danger small"
                                href="#"
                                @click.prevent="vouch(false, user.id, $event)"
                            >
                                confirm
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>
            <div v-if="selectedVeto.vouchingUsers.length >= 2">
                List anyone else who should be in the veto chatroom. For moderation purposes, every NAT can read the discussion, but only people listed can type.
                <input
                    v-model="includeUsers"
                    class="form-control w-75 small"
                    type="text"
                    placeholder="username1, username2, username3..."
                >
                <button
                    class="btn btn-sm btn-danger mt-2"
                    @click="createChatroom($event)"
                >
                    Create veto chatroom with users above
                </button>
            </div>
        </div>

        <div class="mt-4">
            After two Beatmap Nominators vouch for a pending veto, a private chatroom is created between... 
            <ul>
                <li>the veto's creator</li>
                <li>the vouching users</li>
                <li>the mapset host</li>
                <li>anyone else who the NAT thinks is relevant</li>
            </ul>

            ...with the goal of resolving the veto through discussion. If that doesn't work, the veto can be mediated by a larger group of Beatmap Nominators.

        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserLink from '../../UserLink.vue';
export default {
    name: 'Vouches',
    components: {
        UserLink,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
            'isVetoer',
            'isVouchingUser',
        ]),
    },
    data() {
        return {
            confirmDelete: null,
            includeUsers: '',
        };
    },
    methods: {
        async vouch (isVouching, specificUserId, e) {
            let text = `Are you sure?\n\nBy vouching for this veto, you are expected to participate in an anonymous discussion with the mapper.`;

            if (!isVouching || confirm(text)) {
                const data = await this.$http.executePost(`/vetoes/toggleVouch/${this.selectedVeto.id}`, { specificUserId }, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
        async createChatroom (e) {
            if (confirm(`Are you sure?`)) {
                const data = await this.$http.executePost(`/vetoes/createChatroom/${this.selectedVeto.id}`, { includeUsers: this.includeUsers }, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
    }
};
</script>
