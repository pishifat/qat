<template>
    <div class="d-inline-flex align-items-center">
        <b>
            Subgroup:
        </b>
        <mode-select
            v-if="isStructuralNat()"
            v-model="selectedMode"
            :max-selection="1"
            class="ml-1"
        />
        <button
            class="btn btn-sm btn-nat ml-1 mb-1"
            href="#"
            @click.prevent="changeMode()"
        >
            {{ isStructuralNat() ? 'Evaluation' : 'Structural' }}
        </button>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModeSelect from '../../ModeSelect.vue';

export default {
    name: 'NatSubgroupToggle',
    components: {
        ModeSelect,
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
            return this.selectedUser.modesInfo.find(obj => obj.mode === 'none' && obj.level === 'evaluator');
        },
        async changeMode() {
            const result = confirm(`Are you sure?`);

            const mode = this.isStructuralNat() ? this.selectedMode : 'none';

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
