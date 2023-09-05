<template>
    <div class="d-inline-flex align-items-center">
            <b>
                Subgroup:
            </b>
            <mode-radio-display v-if="isStructuralNat()" v-model="selectedMode" class="ml-1" />
            <button
                class="btn btn-sm btn-nat ml-1 mb-1"
                href="#"
                @click.prevent="changeMode()"
            >
                Assign to {{ isStructuralNat() ? 'evaluation' : 'structural' }}
            </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModeRadioDisplay from '../../ModeRadioDisplay.vue';

export default {
    name: 'NatSubgroupToggle',
    components: {
        ModeRadioDisplay,
    },
    data() {
        return {
            selectedMode: '',
        };
    },
    computed: {
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
    methods: {
        isStructuralNat() {
            return this.selectedUser.modesInfo.find(obj => obj.mode === "none" && obj.level === "evaluator");
        },
        async changeMode() {
            const result = confirm(`Are you sure?`);

            const mode = this.isStructuralNat() ? this.selectedMode : "none";

            if (result) {
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/changeEvaluatorMode`, { mode });

                if (this.$http.isValid(data)) {
                    this.$store.commit('users/updateUser', data.user);
                }
            }
        },
    },
};
</script>
