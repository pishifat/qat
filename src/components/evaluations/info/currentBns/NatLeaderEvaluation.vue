<template>
    <div>
        <div class="row">
            <div class="col-sm-12">
                <b>Self-reported summary:</b>
                <span class="small" v-html="$md.render(selectedEvaluation.selfSummary.comment)" />
            </div>
            <div class="col-sm-12 mb-4">
                Consider the info above and communicate with the NAT member if you think there's a problem.
            </div>
        </div>
        <div class="row">
            <div class="col-sm-4">
                <button
                    class=" btn btn-sm btn-danger btn-block "
                    @click="archiveNatEvaluation($event, 'nat')"
                >
                    Archive
                </button>
            </div>
            <div class="col-sm-4">
                <button
                    class="btn btn-sm btn-bn btn-block"
                    @click="archiveNatEvaluation($event, 'bn')"
                >
                    Archive & move from NAT to BN
                </button>
            </div>
            <div class="col-sm-4">
                <button
                    class="btn btn-sm btn-primary btn-block"
                    @click="archiveNatEvaluation($event, 'user')"
                >
                    Archive & move from NAT to Alumni
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'NatLeaderEvaluation',
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('evaluations', [
            'selectedEvaluation',
        ]),
    },
    methods: {
        async archiveNatEvaluation(e, userGroup) {
            await this.$http.executePost(`/bnEval/setComplete/`, { evalIds: [this.selectedEvaluation.id], userGroup }, e);
            $('#evaluationInfo').modal('hide');
            this.$router.push(`users?id=${this.selectedEvaluation.user.id}`);
        },
    },
};
</script>