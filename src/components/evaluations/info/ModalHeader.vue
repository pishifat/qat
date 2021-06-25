<template>
    <div class="modal-header" :class="isAssigned() ? 'bg-danger' : 'bg-primary'">
        <h5 class="modal-title">
            {{ isApplication ? 'Application Evaluation:' : isBnEvaluation ? 'BN Evaluation:' : 'Resignation Evaluation:' }}
            <user-link
                :osu-id="osuId"
                :username="username"
                @click.stop
            />

            <mode-display :modes="mode" />
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ModeDisplay from '../../ModeDisplay.vue';
import UserLink from '../../UserLink.vue';

export default {
    name: 'ModalHeader',
    components: {
        ModeDisplay,
        UserLink,
    },
    props: {
        osuId: {
            type: Number,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        mode: {
            type: String,
            required: true,
        },
        natEvaluators: {
            type: Array,
            default() {
                return [];
            },
        },
        bnEvaluators: {
            type: Array,
            default() {
                return [];
            },
        },
        isApplication: Boolean,
        isBnEvaluation: Boolean,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    methods: {
        isAssigned () {
            return (this.natEvaluators && this.natEvaluators.some(e => e.id == this.loggedInUser.id) ||
            this.bnEvaluators && this.bnEvaluators.some(e => e.id == this.loggedInUser.id));
        },
    },
};
</script>