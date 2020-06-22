<template>
    <div>
        <div v-for="(mediation, i) in selectedVeto.mediations" :key="mediation.id" class="row my-3">
            <div class="col-sm-2 small">
                <user-avatar
                    v-if="loggedInUser.isNat"
                    :user="mediation.mediator"
                    :text-color="voteColor(mediation.vote)"
                >
                    <a
                        v-if="!mediation.comment && selectedVeto.status === 'wip'"
                        href="#"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="replace mediator"
                        @click.prevent="replaceMediator(mediation.id);"
                    >
                        <i class="fas fa-redo-alt text-success" />
                    </a>
                </user-avatar>

                <div v-else class="text-center my-2" :class="voteColor(mediation.vote)">
                    User {{ i + 1 }}
                </div>
            </div>
            <div class="col-sm-10 card card-body small">
                <div v-if="!mediation.comment">
                    ...
                </div>
                <div
                    v-else
                    v-html="$md.render(mediation.comment.trim())"
                />
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import postData from '../../../mixins/postData';
import UserAvatar from '../../UserAvatar.vue';

export default {
    name: 'Mediations',
    components: {
        UserAvatar,
    },
    mixins: [ postData ],
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('vetoes', [
            'selectedVeto',
        ]),
    },
    methods: {
        voteColor (vote) {
            switch (vote) {
                case 1:
                    return 'text-success'; // agree
                case 2:
                    return 'text-neutral'; // neutral
                case 3:
                    return 'text-danger'; // disagree
            }
        },
        async replaceMediator (mediationId) {
            const result = confirm(`Are you sure? This should only be done if a mistake was made.`);

            if (result) {
                const veto = await this.executePost(`/vetoes/replaceMediator/${this.selectedVeto.id}`, { mediationId });

                if (veto && !veto.error) {
                    this.$store.commit('vetoes/updateVeto', veto);
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
