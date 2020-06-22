<template>
    <div class="modal-header" :class="isNatEvaluator() ? 'bg-info' : 'bg-primary'">
        <h5 class="modal-title">
            {{ isApplication ? 'Application Evaluation:' : 'BN Evaluation:' }}
            <a
                :href="'https://osu.ppy.sh/users/' + osuId"
                target="_blank"
                @click.stop
            >
                {{ username }}
            </a>

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

export default {
    name: 'ModalHeader',
    components: {
        ModeDisplay,
    },
    props: {
        isApplication: Boolean,
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
    },
    computed: mapState([
        'loggedInUser',
    ]),
    methods: {
        isNatEvaluator() {
            for (let i = 0; i < this.natEvaluators.length; i++) {
                let user = this.natEvaluators[i];

                if (user.id == this.loggedInUser.id) {
                    return true;
                }
            }

            return false;
        },
    },
};
</script>