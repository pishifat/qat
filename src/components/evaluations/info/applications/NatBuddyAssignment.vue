<template>
    <div>
        <p>
            <span class="form-inline">
                <b>NAT buddy: </b>
                <select
                    id="user"
                    v-model="selectedUserId"
                    class="form-control form-control-sm ml-2"
                    @change="assignNatBuddy($event);"
                >
                    <option
                        value=""
                        disabled
                    >
                        Select a user
                    </option>
                    <option
                        v-for="user in nat"
                        :key="user.id"
                        :value="user.id"
                    >
                        {{ user.username }}
                    </option>
                    <option v-if="!nat.length" disabled>
                        ...
                    </option>
                </select>
            </span>
        </p>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import evaluations from '../../../../mixins/evaluations.js';

export default {
    name: 'NatBuddyAssignment',
    mixins: [evaluations],
    data () {
        return {
            nat: [],
            selectedUserId: '',
        };
    },
    computed: {
        ...mapGetters('evaluations', ['selectedEvaluation']),
    },
    async created() {
        await this.loadNat();
    },
    watch: {
        async selectedEvaluation() {
            await this.loadNat();
        },
    },
    methods: {
        async loadNat() {
            this.nat = [];

            const nat = await this.$http.executeGet(
                `/users/loadNatInMode/${this.selectedEvaluation.mode}`
            );

            if (this.$http.isValid(nat)) {
                this.nat = nat;
            }

            if (this.selectedEvaluation.natBuddy) {
                this.selectedUserId = this.selectedEvaluation.natBuddy.id;
            } else {
                this.selectedUserId = '';
            }
        },
        async assignNatBuddy(e) {
            const result = await this.$http.executePost(`/appEval/assignNatBuddy/${this.selectedEvaluation.id}/${this.selectedUserId}`, e); 
            
            if (result && !result.error) {
                this.$store.commit('evaluations/updateEvaluation', result);
                this.$store.dispatch('updateToastMessages', {
                    message: `Assigned NAT buddy`,
                    type: 'success',
                });
            }  
        },
    },
}
</script>
