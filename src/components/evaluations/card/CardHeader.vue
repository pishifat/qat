<template>
    <div class="card-body">
        <p class="card-text">
            <a :href="'https://osu.ppy.sh/users/' + osuId" target="_blank">
                <b>{{ username }}</b>
            </a>
        </p>
        <div v-if="consensus">
            Consensus:
            <span :class="`text-${consensus}`">{{ consensus }}</span>
        </div>
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
    },
};
</script>
