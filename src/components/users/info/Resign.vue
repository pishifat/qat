<template>
    <div>
        <button
            class="btn btn-block btn-danger"
            data-toggle="tooltip"
            data-placement="top"
            title="The NAT will evaluate your recent activity and remove you from the BN (usually within 24 hours)."
            @click="resignFromBn($event)"
        >
            Resign from the Beatmap Nominators
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'BnEvaluatorToggle',
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async resignFromBn(e) {
            const result = confirm(`Are you sure? You will no longer be a Beatmap Nominator.`);

            if (result) {
                await this.$http.executePost(`/users/resignFromBn/${this.selectedUser.id}`, {}, e);
            }
        },
    },
};
</script>