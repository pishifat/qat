<template>
    <div class="card-footer d-flex justify-content-start align-items-center">
        <span
            v-if="loggedInUser && loggedInUser.isNatOrTrialNat && !isDiscussion"
            class="badge badge-info mx-1"
            data-toggle="tooltip"
            data-placement="top"
            :title="separateEvals()"
        >
            {{ reviews.length }}
        </span>

        <add-votes
            v-else-if="loggedInUser && ((loggedInUser.isNatOrTrialNat && !isNat) || loggedInUser.isNatLeader) && isDiscussion"
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
                data-toggle="tooltip"
                data-placement="top"
                title="final deadline"
            >
                {{ transformedDeadline(deadline) }}
            </span>
        </span>

        <input
            v-if="loggedInUser && loggedInUser.isNat && isActive"
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
        archivedAt: {
            type: String,
            default: '',
        },
        isDiscussion: Boolean,
        isActive: Boolean,
        isNat: Boolean,
        isPublic: Boolean,
        isApplication: {
            type: Boolean,
            default: false,
        },
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
                return this.$options.filters.toRelativeDate(deadline);
            } else if (this.archivedAt && this.archivedAt.length) {
                return this.$options.filters.toStandardDate(this.archivedAt);
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
