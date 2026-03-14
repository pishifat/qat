<template>
    <div class="row ">
        <div class="col-md-12">
            <veto-detail-header v-if="selectedVeto" />
            <veto-detail-content />
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border" role="status" />
            </div>
            <div v-if="!loading && error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2" />
                {{ error }}
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import vetoesModule from '../store/vetoes';
import VetoDetailHeader from '../components/vetoes/info/VetoDetailHeader.vue';
import VetoDetailContent from '../components/vetoes/VetoDetailContent.vue';

export default {
    name: 'VetoDetailPage',
    components: {
        VetoDetailHeader,
        VetoDetailContent,
    },
    data() {
        return {
            loading: true,
            error: null,
        };
    },
    computed: {
        ...mapGetters('vetoes', ['selectedVeto']),
    },
    beforeCreate() {
        if (!this.$store.hasModule('vetoes')) {
            this.$store.registerModule('vetoes', vetoesModule);
        }
    },
    async mounted() {
        const id = this.$route.params.id;
        if (!id) {
            this.loading = false;
            this.error = 'Veto not found';
            return;
        }
        this.$store.commit('vetoes/setSelectedVetoId', id);
        const veto = await this.$http.initialRequest(`/v2/vetoes/${id}`);
        this.loading = false;
        if (this.$http.isValid(veto)) {
            this.$store.commit('vetoes/setSelectedVeto', veto);
        } else {
            this.error = veto?.error || 'Veto not found';
        }
    },
    beforeUnmount() {
        this.$store.commit('vetoes/setSelectedVeto', null);
    },
};
</script>
