<template>
    <div class="mb-2">
        <hr>
        <div>
            If you want this veto to take effect, you can anonymously <b>vouch for it below!</b>
        </div>
        <div v-if="loggedInUser.isNat" class="text-secondary small">Only members of the BN can vouch. NAT members are responsible for moderation.</div>

        <button
            class="btn btn-sm btn-danger mt-2"
            @click="vouch($event)"
            :disabled="loggedInUser.isNat"
        >
            I vouch for this veto!
        </button>

        <div class="mt-4">
            After two Beatmap Nominators vouch for a pending veto, a private chatroom is created between... 
            <ul>
                <li>the veto's creator</li>
                <li>the vouching Beatmap Nominators</li>
                <li>the map's creator(s)</li>
            </ul>

            ...with the goal of resolving the veto through discussion. If that doesn't work, the veto can be mediated by a larger group of Beatmap Nominators.

        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
export default {
    name: 'Vouches',
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
    },
    methods: {
        async vouch (e) {
            if (confirm(`Are you sure?\n\nBy vouching for this veto, you are expected to participate in an anonymous discussion with the mapper.`)) {
                const data = await this.$http.executePost(`/vetoes/vouch/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
    }
};
</script>
