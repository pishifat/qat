<template>
    <div class="card-footer d-flex justify-content-start align-items-center">
        <span
            v-if="isNat && !isDiscuss"
            class="badge badge-info mx-1"
            data-toggle="tooltip"
            data-placement="top"
            :title="separateEvals()"
        >
            {{ evaluations.length }}
        </span>

        <add-votes
            v-else-if="isNat && isDiscuss"
            :evaluations="evaluations"
        />

        <i
            v-if="feedback"
            data-toggle="tooltip"
            data-placement="top"
            title="feedback written"
            class="fas fa-comment mx-1"
        />

        <span class="mr-1 ml-auto small">
            <i
                class="fas fa-clock mr-1"
                data-toggle="tooltip"
                data-placement="top"
                title="deadline"
            />
            {{ createDeadline() }}
        </span>

        <input
            v-if="isNat && !isArchive"
            :id="nominatorAssessmentMongoId + '-check'"
            class="mx-1 ml-auto"
            type="checkbox"
            name="evalTypeCheck"
            :value="nominatorAssessmentMongoId"
            @click.stop="$emit('check-selection')"
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
        nominatorAssessmentMongoId: {
            type: String,
            required: true,
        },
        evaluations: {
            type: Array,
            default() {
                return [];
            },
        },
        isDiscuss: Boolean,
        date: {
            type: String,
            required: true,
        },
        isApplication: Boolean,
        isArchive: Boolean,
        feedback: {
            type: String,
            default: '',
        },
    },
    computed: {
        ...mapState([
            'isNat',
        ]),
    },
    methods: {
        separateEvals() {
            let bn = 0;
            let nat = 0;
            this.evaluations.forEach(e => {
                if (e.evaluator.group == 'bn') bn++;
                else nat++;
            });

            return bn + (bn == 1 ? ' BN eval, ' : ' BN evals, ') + nat + (nat == 1 ? ' NAT eval' : ' NAT evals');
        },
        createDeadline() {
            let deadline = new Date(this.date);

            if (this.isApplication) {
                let delay = this.isDiscuss ? 14 : 7;
                deadline = new Date(deadline.setDate(deadline.getDate() + delay)).toString().slice(4,10);

                return deadline;
            } else {
                return deadline.toString().slice(4,10);
            }
        },
    },
};
</script>