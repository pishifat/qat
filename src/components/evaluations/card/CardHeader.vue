<template>
    <div class="card-body mx-1" :class="consensusColor">
        <p class="card-text">
            <a :href="'https://osu.ppy.sh/users/' + osuId" target="_blank">
                {{ username }}
            </a>
        </p>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'CardHeader',
    props: {
        username: {
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
    },
    computed: {
        ...mapState([
            'isNat',
        ]),
        consensusColor() {
            if (this.consensus && this.isNat) {
                return 'border-bottom border-' + this.consensus;
            }

            return '';
        },
    },
};
</script>

<style scoped>

.card-consensus-status {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 0px;
    height: 0px;
    border-bottom: 15px solid transparent;
    border-right: 15px solid transparent;
    z-index: 10000;
}

</style>