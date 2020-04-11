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
        isNat: Boolean,
        consensus: {
            type: String,
            default() {
                return null;
            },
        },
    },
    computed: {
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