<template>
    <div class="modal-header text-dark" :class="isNatEvaluator() ? 'bg-priority' : 'bg-nat-logo'">
        <h5 class="modal-title">
            {{ isApplication ? 'Application Evaluation:' : 'BN Evaluation:' }} 
            <a :href="'https://osu.ppy.sh/users/' + osuId" class="text-dark" target="_blank" @click.stop>
                {{ username }}
            </a>
            <i v-if="mode == 'osu'" class="far fa-circle" />
            <i v-else-if="mode == 'taiko'" class="fas fa-drum" />
            <i v-else-if="mode == 'catch'" class="fas fa-apple-alt" />
            <i v-else-if="mode == 'mania'" class="fas fa-stream" />
        </h5>
        <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
        </button>
    </div>
</template>

<script>

export default {
    name: 'ModalHeader',
    props: {
        mode: String,
        natEvaluators: Array,
        isApplication: Boolean,
        osuId: Number,
        username: String,
        evaluatorMongoId: String,
    },
    methods: {
        isNatEvaluator() {
            for (let i = 0; i < this.natEvaluators.length; i++) {
                let user = this.natEvaluators[i];
                if(user.id == this.evaluatorMongoId){
                    return true;
                }
            }
            return false;
        },
    },
};
</script>