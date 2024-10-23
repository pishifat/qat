<template>
    <section class="card card-body">
        <h3 class="mb-0">
            <a
                data-toggle="collapse"
                href='#data-collection'
            >
                Data Collection
                <i class="fas fa-angle-down" />
            </a>
        </h3>
        <div id="data-collection" class="collapse">
            <hr />
            <h5>Synchronize events of a beatmapset</h5>
            <span class="small text-secondary mb-2">
                Only use this for confirmed cases of missing nominations/resets.
            </span>
            <div class="form-inline">
                <input 
                    v-model="beatmapsetLink"
                    class="form-control mb-2 "
                    type="text"
                    placeholder="beatmapset link..."
                />
                <button
                    class="btn btn-sm btn-secondary mb-2 ml-2"
                    @click="syncEvents"
                >
                    Sync events
                </button>
            </div>
        </div>
    </section>
</template>

<script>
import evaluations from '../../mixins/evaluations.js';
export default {
    name: 'SyncEvents',
    mixins: [ evaluations ],
    data () {
        return {
            beatmapsetLink: '',
        };
    },
    methods: {
        async syncEvents (e) {
            const beatmapsetId = this.getBeatmapsetIdFromLink(this.beatmapsetLink);

            if (!beatmapsetId) {
                return this.$store.dispatch('updateToastMessages', {
                    type: 'danger',
                    message: 'Please enter a valid beatmapset link!',
                });
            }
            if(!confirm("Are you sure? Only use when necessary.")) {
                return;
            }
            await this.$http.executePost(`/dataCollection/syncBeatmapsetEvents/${beatmapsetId}`, {}, e);
        },
    },
};
</script>
