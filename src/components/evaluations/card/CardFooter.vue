<template>
    <div class="card-footer d-flex justify-content-start align-items-center">
        <span
            v-if="(loggedInUser.isNatOrTrialNat) && !isDiscussion"
            class="badge badge-info mx-1"
            data-toggle="tooltip"
            data-placement="top"
            :title="separateEvals()"
        >
            {{ reviews.length }}
        </span>

        <add-votes
            v-else-if="((loggedInUser.isNatOrTrialNat && !isNat) || loggedInUser.isNatLeader || isPublic) && isDiscussion"
            :inputs="reviews"
        />

        <span class="mr-1 ml-auto small">
            <i
                class="fas fa-clock mr-1"
                data-toggle="tooltip"
                data-placement="top"
                title="deadline"
            />
            <span
                v-if="individualDeadline"
                data-toggle="tooltip"
                data-placement="top"
                title="individual deadline"
            >
                {{ transformedDeadline(individualDeadline) }} —
            </span>
            <span
                data-toggle="tooltip"
                data-placement="top"
                title="final deadline"
            >
                {{ transformedDeadline(deadline) }}
            </span>
        </span>

        <input
            v-if="loggedInUser.isNat && isActive"
            v-model="checkedEvaluations"
            class="mx-1 ml-auto"
            type="checkbox"
            :value="evaluationId"
            @click.stop
        >
    </div>
</template>

<script>
import { mapState } from 'vuex';
import AddVotes from '../card/AddVotes.vue';

export default {
    name: 'CardFooter',
    components: {
        AddVotes,
    },
    props: {
        evaluationId: {
            type: String,
            required: true,
        },
        /** @type {import('vue').PropOptions<Object[]>} */
        reviews: {
            type: Array,
            default() {
                return [];
            },
        },
        deadline: {
            type: String,
            required: true,
        },
        individualDeadline: {
            type: String,
            default: null,
        },
        archivedAt: {
            type: String,
            default: '',
        },
        isDiscussion: Boolean,
        isActive: Boolean,
        isNat: Boolean,
        isPublic: Boolean,
        isApplication: Boolean,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        checkedEvaluations: {
            get () {
                return this.$store.state.evaluations.checkedEvaluations;
            },
            set (checks) {
                this.$store.commit('evaluations/updateCheckedEvaluations', checks);
            },
        },
    },
    methods: {
        transformedDeadline (deadline) {
            if (this.isActive) {
                return this.$moment(deadline).fromNow();
            } else if (this.archivedAt && this.archivedAt.length) {
                return this.$options.filters.toStandardDate(archivedAt);
            } else {
                return this.$options.filters.toStandardDate(deadline);
            }
        },
        separateEvals() {
            let bn = 0;
            let nat = 0;
            this.reviews.forEach(e => {
                if (e.evaluator.isBn) bn++;
                else nat++;
            });

            return bn + (bn == 1 ? ' BN eval, ' : ' BN evals, ') + nat + (nat == 1 ? ' NAT eval' : ' NAT evals');
        },
    },
};
</script>
