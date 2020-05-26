<template>
    <div class="text-shadow">
        <div v-for="(mediation, i) in selectedVeto.mediations" :key="mediation.id" class="row border-bottom border-dark my-2">
            <div class="col-sm-2">
                <div v-if="isNat">
                    <a
                        :href="'https://osu.ppy.sh/users/' + mediation.mediator.osuId"
                        class="small d-flex flex-column ml-auto font-weight-bold text-center"
                        :class="voteColor(mediation.vote)"
                    >
                        <img :src="'https://a.ppy.sh/' + mediation.mediator.osuId" class="card-avatar-img mx-auto">
                        {{ mediation.mediator.username }}
                    </a>
                    <a
                        v-if="!mediation.comment && selectedVeto.status === 'wip'"
                        class="small d-flex flex-column ml-auto text-center mb-2"
                        href="#"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="replace mediator"
                        @click.prevent="replaceMediator(mediation.id);"
                    >
                        <i class="fas fa-redo-alt vote-pass" />
                    </a>
                </div>
                <div v-else>
                    <span
                        class="small d-flex flex-column ml-auto text-center"
                        :class="voteColor(mediation.vote)"
                    >
                        User {{ i+1 }}
                    </span>
                </div>
            </div>
            <div class="col-sm-10">
                <pre v-if="!mediation.comment" class="pre-font small">...</pre>
                <pre
                    v-else
                    class="pre-font small"
                    v-html="filterLinks(mediation.comment.trim())"
                />
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import filterLinks from '../../../mixins/filterLinks';
import postData from '../../../mixins/postData';

export default {
    name: 'Mediations',
    mixins: [ filterLinks, postData ],
    computed: {
        ...mapState([
            'isNat',
        ]),
        ...mapGetters([
            'selectedVeto',
        ]),
    },
    methods: {
        voteColor (vote) {
            switch (vote) {
                case 1:
                    return 'vote-pass';
                case 2:
                    return 'vote-neutral';
                case 3:
                    return 'vote-fail';
            }
        },
        async replaceMediator (mediationId) {
            const result = confirm(`Are you sure? This should only be done if a mistake was made.`);

            if (result) {
                const veto = await this.executePost(`/vetoes/replaceMediator/${this.selectedVeto.id}`, { mediationId });

                if (veto && !veto.error) {
                    this.$store.dispatch('updateVeto', veto);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Replaced mediator`,
                        type: 'success',
                    });
                }
            }
        },
    },
};
</script>

<style scoped>

.card-avatar-img {
    max-width: 48px;
    max-height: 48px;
    object-fit: cover;
    border-radius: 100%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25);
}

</style>