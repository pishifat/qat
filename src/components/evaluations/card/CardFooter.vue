<template>
    <div class="card-footer small d-flex justify-content-start align-items-center">
        <i v-if="mode == 'osu'" class="far fa-circle mx-1" />
        <i v-else-if="mode == 'taiko'" class="fas fa-drum" />
        <i v-else-if="mode == 'catch'" class="fas fa-apple-alt" />
        <i v-else-if="mode == 'mania'" class="fas fa-stream" />
        <span
            v-if="isNat"
            class="badge badge-none mx-1"
            data-toggle="tooltip"
            data-placement="top"
            :title="separateEvals()"
        >{{ evaluations.length }}
        </span>
        <i
            class="fas fa-clock mx-1"
            data-toggle="tooltip"
            data-placement="top"
            title="deadline"
        />
        <span class="errors mx-1">
            {{ createDeadline() }}
        </span>
        <input
            v-if="isLeader"
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
export default {
    name: 'card-footer',
    props: {
        mode: String,
        isNat: Boolean,
        isLeader: Boolean,
        nominatorAssessmentMongoId: String,
        evaluations: Array,
        isDiscuss: Boolean,
        date: String,
        isExactDeadline: Boolean,
    },
    methods: {
        separateEvals() {
            let bn = 0;
            let nat = 0;
            this.evaluations.forEach(e => {
                if(e.evaluator.group == 'bn') bn++;
                else nat++;
            });
            return bn + (bn == 1 ? ' BN eval, ' : ' BN evals, ') + nat + (nat == 1 ? ' NAT eval' : ' NAT evals');
        },
        createDeadline() {
            let deadline = new Date(this.date);
            let delay = this.isExactDeadline ? 0 : 7;
            deadline = new Date(deadline.setDate(deadline.getDate() + delay)).toString().slice(4, 10);
            return deadline;
        },
    }
};
</script>