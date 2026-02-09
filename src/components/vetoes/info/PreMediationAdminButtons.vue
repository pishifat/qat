<template>
    <div>
        <hr />
        <b>NAT moderation</b>
        <div class="row mt-2">
            <!-- move to "available" status -->
            <div class="col-sm-6">
                <button
                    class="btn btn-sm btn-danger btn-block mb-2"
                    @click="setStatusAvailable($event)"
                >
                    Move to mediation
                </button>
            </div>

            <!-- move to "archive" status -->
            <div class="col-sm-6">
                <button
                    class="btn btn-sm btn-block btn-danger mb-2"
                    @click="setStatusArchive($event)"
                >
                    Move to archive
                </button>
            </div>
        </div>
    </div>
    
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'PreMediationAdminButtons',
    computed: {
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
    },
    methods: {
        async setStatusAvailable (e) {
            if (confirm(`Are you sure?`)) {
                const data = await this.$http.executePost(`/vetoes/setStatusAvailable/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
        async setStatusArchive (e) {
            if (confirm(`Are you sure?`)) {
                const data = await this.$http.executePost(`/vetoes/setStatusArchive/${this.selectedVeto.id}`, {}, e);

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
    }
};
</script>