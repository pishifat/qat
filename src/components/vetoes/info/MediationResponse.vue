<template>
    <div class="row my-3">
        <div class="col-sm-2 small">
            <user-avatar
                v-if="loggedInUser.isNat"
                :user="mediation.mediator"
                :text-color="voteColor(mediation.vote)"
            >
                <span v-if="mediation.vote == 2" class="text-secondary small">(partially agree)</span>
                <a
                    v-if="!mediation.comment && selectedVeto.status === 'wip'"
                    href="#"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="replace mediator"
                    @click.prevent="replaceMediator(mediation.mediator.id);"
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
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import UserAvatar from '../../UserAvatar.vue';

export default {
    name: 'MediationResponse',
    components: {
        UserAvatar,
    },
    props: {
        mediation: {
            type: Object,
            required: true,
        },
        i: {
            type: Number,
            required: true,
        },
    },
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
                case 2:
                    return 'text-success'; // agree/partially agree
                case 3:
                    return 'text-danger'; // disagree
            }
        },
        async replaceMediator (userId) {
            const result = confirm(`Are you sure? This should only be done if a mistake was made.`);

            if (result) {
                const data = await this.$http.executePost(`/vetoes/replaceMediator/${this.selectedVeto.id}`, { userId });

                if (this.$http.isValid(data)) {
                    this.$store.commit('vetoes/updateVeto', data.veto);
                }
            }
        },
    },
};
</script>
