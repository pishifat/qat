<template>
    <div class="row align-items-center">
        <div class="col-10 col-sm-8 col-lg-4 d-flex">
            <img class="rounded-left d-none d-sm-block" style="width: 48px; height: 48px;" :src="`https://a.ppy.sh/${request.user.osuId}`">
            <div class="text-truncate ml-2">
                <a :href="`https://osu.ppy.sh/beatmapsets/${request.beatmapset.osuId}`" target="_blank">
                    {{ request.beatmapset.fullTitle }}
                </a>
                <div>
                    by <a :href="`https://osu.ppy.sh/users/${request.user.osuId}`" target="_blank">
                        {{ request.user.username }}
                    </a>
                </div>
            </div>
        </div>
        <div class="col-12 col-lg-6 order-2 order-lg-1 my-2 my-lg-0">
            <request-tag v-if="request.user.rankedBeatmapsets">
                hasRankedMaps ({{ request.user.rankedBeatmapsets }})
            </request-tag>
            <request-tag>
                {{ request.beatmapset.totalLengthString }} ({{ (request.beatmapset.totalLength / 60).toFixed(1) }} min | {{ (request.beatmapset.totalLength / 60).toFixed(1) }} min)
            </request-tag>
            <request-tag>
                {{ request.category }}
            </request-tag>
            <request-tag>
                {{ request.beatmapset.genre }} / {{ request.beatmapset.language }}
            </request-tag>
            <request-tag v-for="(mode, i) in request.beatmapset.modes" :key="i">
                {{ mode }}
            </request-tag>
            <request-tag>
                {{ bpmSpeed }} ({{ request.beatmapset.bpm }} BPM)
            </request-tag>
            <template v-if="request.modReviews.length > 0">
                <request-tag
                    v-if="acceptedReviews.length"
                    class-list="badge-success"
                >
                    Accepted ({{ acceptedReviews.length }})
                </request-tag>
                <request-tag
                    v-else
                    class-list="badge-warning"
                >
                    Denied ({{ deniedReviews.length }})
                </request-tag>
            </template>
            <request-tag
                v-else
                class-list="badge-danger"
            >
                Not Reviewed
            </request-tag>
            <request-tag v-if="request.beatmapset.events.length">
                {{ request.beatmapset.events[0].type }}
            </request-tag>
        </div>
        <div class="col-2 col-sm-4 col-lg-2 d-flex justify-content-end align-items-center order-1 order-lg-2 h-100">
            <span class="d-none d-sm-block">
                {{ $moment(request.createdAt).fromNow() }}
            </span>
            <a
                href="#"
                data-toggle="modal"
                data-target="#modRequestDetail"
                @click.prevent="$store.commit('updateSelectRequestId', request.id)"
            >
                <i class="fas fa-ellipsis-v px-3" />
            </a>
        </div>
    </div>
</template>

<script>
import RequestTag from './RequestTag.vue';

export default {
    name: 'RequestRow',
    components: {
        RequestTag,
    },
    props: {
        request: {
            type: Object,
            required: true,
        },
    },
    computed: {
        /** @returns {array} */
        acceptedReviews () {
            return this.request.modReviews.filter(r => r.action === 'accepted');
        },
        /** @returns {array} */
        deniedReviews () {
            return this.request.modReviews.filter(r => r.action === 'denied');
        },
        /** @returns {string} */
        bpmSpeed () {
            const bpm = this.request.beatmapset.bpm;
            if (bpm < 160) return 'slow';
            else if (bpm >= 190) return 'fast';
            else return 'average';
        },
    },
};
</script>
