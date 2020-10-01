<template>
    <div class="my-2 rounded">
        <div
            class="row no-gutters"
            style="position: relative"
        >
            <div
                :style="`background-image: url('https://assets.ppy.sh/beatmaps/${request.beatmapset.osuId}/covers/cover.jpg';`"
                class="rounded-top request-row-bg"
            />

            <div class=" request-row-bg-fade" />

            <div class="col-sm-12">
                <slot />
            </div>
        </div>

        <div v-if="request.comment" class="row no-gutters py-1 px-2 bg-dark">
            <div class="col-sm-12 small text-truncate">
                {{ request.comment }}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'RequestWrapper',
    props: {
        request: {
            type: Object,
            required: true,
        },
    },
};
</script>

<style>

.request-row-bg {
    width: 100%;
    height: 100%;
    opacity: 0.2;
    background-size: cover;
    position: absolute;
}

.request-row-bg-fade {
    height: 100%;
    width: 100%;
    position: absolute;
    background: linear-gradient(103deg, transparent 60%, #242424 100%);
}

</style>
