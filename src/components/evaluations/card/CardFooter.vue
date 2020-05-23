<template>
    <div class="card-footer small d-flex justify-content-start align-items-center">
        <i v-if="mode == 'osu'" class="far fa-circle mx-1" />
        <i v-else-if="mode == 'taiko'" class="fas fa-drum mx-1" />
        <i v-else-if="mode == 'catch'" class="fas fa-apple-alt mx-1" />
        <i v-else-if="mode == 'mania'" class="fas fa-stream mx-1" />
        <span
            v-if="isNat && !isDiscuss"
            class="badge badge-none mx-1"
            data-toggle="tooltip"
            data-placement="top"
            :title="separateEvals()"
        >{{ evaluations.length }}
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
        <span class="errors mx-1 ml-auto">
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
        mode: {
            type: String,
            required: true,
        },
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