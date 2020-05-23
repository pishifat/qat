<template>
    <div class="card-body mx-1">
        <div v-if="consensus && isNat" class="card-status" :class="consensusColor" />
        <p class="card-text text-shadow">
            <a :href="'https://osu.ppy.sh/users/' + osuId" target="_blank" @click.stop>
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
            default() {
                return null;
            },
        },
    },
    computed: {
        ...mapState([
            'isNat',
        ]),
        consensusColor() {
            if (!this.consensus) {
                return '';
            } else {
                return 'card-status-' + this.consensus;
            }
        },
    },
};
</script>