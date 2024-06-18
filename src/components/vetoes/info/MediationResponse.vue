<template>
    <div class="row my-3">
        <div class="col-sm-2 small">
            <user-avatar
                v-if="loggedInUser.isNat"
                :user="mediation.mediator"
                :text-color="voteColor(mediation.vote)"
            >
                <span v-if="mediation.vote == 2" class="text-secondary small">(partially agree)</span> <!-- only used in vetoFormat 1 and 2-->
            </user-avatar>

            <div v-else class="text-center my-2" :class="voteColor(mediation.vote)">
                Anonymous
            </div>
        </div>
        <div class="col-sm-10 card card-body small">
            <div v-if="!mediation.comment">
                ...
            </div>
            <div
                v-else
                class="v-html-content"
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
    },
};
</script>
