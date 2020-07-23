<template>
    <section class="card">
        <h5 class="card-header">
            {{ title }}
        </h5>
        <div class="card-body">
            <div
                v-for="request in requests"
                :key="request.id"
                class="row no-gutters rounded my-1"
                style="position: relative"
            >
                <div
                    :style="`background-image: url('https://assets.ppy.sh/beatmaps/${request.beatmapset.osuId}/covers/cover.jpg'; position: absolute; `"
                    style="width: 100%; height: 100%; opacity: 0.2; background-size: cover;"
                    class="rounded"
                />
                <div class="col-sm-12">
                    <slot :request="request" />
                </div>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    name: 'RequestsListing',
    props: {
        title: {
            type: String,
            default: 'Requests',
        },
        requests: {
            type: Array,
            default () {
                return [];
            },
        },
    },
};
</script>
