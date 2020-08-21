<template>
    <div class="card-body">
        <p class="card-text">
            <a :href="'https://osu.ppy.sh/users/' + osuId" target="_blank">
                <b>{{ username }}</b>
            </a>
            <i v-if="mode == 'osu'" class="far fa-circle mx-1" />
            <i v-else-if="mode == 'taiko'" class="fas fa-drum mx-1" />
            <i v-else-if="mode == 'catch'" class="fas fa-apple-alt mx-1" />
            <i v-else-if="mode == 'mania'" class="fas fa-stream mx-1" />
            <i
                v-if="feedback"
                data-toggle="tooltip"
                data-placement="top"
                title="feedback written"
                class="fas fa-comment mx-1"
            />
        </p>
        <div v-if="consensus">
            Consensus:
            <span :class="consensusColor">{{ consensusText }}</span>
        </div>
        <div v-if="addition && addition != 'none'">
            Addition:
            <span :class="consensusColor">{{ additionText }}</span>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CardHeader',
    props: {
        username: {
            type: String,
            required: true,
        },
        mode: {
            type: String,
            required: true,
        },
        osuId: {
            type: Number,
            required: true,
        },
        consensus: {
            type: String,
            default: '',
        },
        addition: {
            type: String,
            default: 'none',
        },
        feedback: {
            type: String,
            default: '',
        },
    },
    computed: {
        consensusText() {
            switch (this.consensus) {
                case null:
                    return 'None';
                case 'fullBn':
                    return 'Full BN';
                case 'probationBn':
                    return 'Probation BN';
                case 'removeFromBn':
                    return 'Remove from BN';
                case 'resignedOnGoodTerms':
                    return 'Resigned on good terms';
                case 'resignedOnStandardTerms':
                    return 'Resigned on standard terms';
                default:
                    return this.consensus.charAt(0).toUpperCase() + this.consensus.slice(1);
            }
        },
        additionText() {
            const addition = this.addition;

            switch (addition) {
                case 'lowActivity':
                    return 'Low activity warning';
                default:
                    return 'None';
            }
        },
        consensusColor() {
            const consensus = this.consensus;

            switch (consensus) {
                case 'pass':
                    return 'text-pass';
                case 'fullBn':
                    return 'text-pass';
                case 'resignedOnGoodTerms':
                    return 'text-pass';
                case 'fail':
                    return 'text-fail';
                case 'removeFromBn':
                    return 'text-fail';
                case 'probationBn':
                    return 'text-probation';
                case 'resignedOnStandardTerms':
                    return 'text-neutral';
                default:
                    return '';
            }
        },
    },
};
</script>
