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
import postData from '../../../mixins/postData.js';

export default {
    name: 'BnEvaluatorToggle',
    mixins: [postData],
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async resignFromBn(e) {
            const result = confirm(`Are you sure? You will no longer be a Beatmap Nominator.`);

            if (result) {
                const success = await this.executePost(`/users/resignFromBn/${this.selectedUser.id}`, {}, e);

                if (success && !success.error) {
                    this.$store.dispatch('updateToastMessages', {
                        message: `Your removal will be processed soon`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>