<template>
    <div>
        <div class="ms-2">
            <a
                :href="`#resign-${mode}`"
                class="text-danger fw-bold"
                data-bs-toggle="collapse"
            >Resign from the {{ formatMode(mode) }} Beatmap Nominators <i class="fas fa-angle-down" /></a>
        </div>
        <div :id="`resign-${mode}`" class="collapse">
            <div class="ms-2 mt-2 mb-2">
                Anything you want to share with the NAT about your resignation? This is completely optional.
                <textarea
                    v-model="comment"
                    class="form-control mb-2"
                    rows="2"
                    maxlength="1000"
                    placeholder="optional..."
                />
                <button
                    class="btn w-100 btn-danger"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="The NAT will evaluate your recent activity and remove you from the BN (usually within 24 hours)."
                    @click="resignFromBn($event)"
                >
                    Resign
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import evaluations from '../../../mixins/evaluations';

export default {
    name: 'BnEvaluatorToggle',
    mixins: [ evaluations ],
    props: {
        mode: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            comment: '',
        };
    },
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        async resignFromBn(e) {
            const result = confirm(`Are you sure? You will no longer be a Beatmap Nominator for ${this.formatMode(this.mode)}.`);

            if (result) {
                await this.$http.executePost(`/users/resignFromBn/${this.selectedUser.id}`, {
                    mode: this.mode,
                    comment: this.comment,
                }, e);
            }
        },
    },
};
</script>