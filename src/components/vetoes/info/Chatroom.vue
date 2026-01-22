<template>
    <div class="mb-2">
        asdf
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserLink from '../../UserLink.vue';
export default {
    name: 'Chatroom',
    components: {
        UserLink,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
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

                console.log('in');
                const data = await this.$http.executePost(`/vetoes/createChatroom/${this.selectedVeto.id}`, { includeUsers: this.includeUsers }, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
    }
};
</script>
