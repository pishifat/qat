<template>
    <div>
        <div class="card static-card">
            <div class="card-header min-spacing d-flex align-items-center">
                <div class="col-sm-6 mr-2" style="padding-left: 0px;">
                    <a 
                        :href="'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId" 
                        target="_blank"
                        class="text-shadow"
                    >
                        <img
                            class="beatmap-thumbnail mr-2"
                            :src="'https://b.ppy.sh/thumb/' + event.beatmapsetId + '.jpg'"
                        >
                        {{ event.metadata.length > 50 ? event.metadata.slice(0,50) + '...' : event.metadata }}
                    </a>
                </div>
                <div class="col-sm-2 small d-flex justify-content-end">
                    <span class="text-white-50">
                        Hosted by
                        <a :href="'https://osu.ppy.sh/users/' + event.userId" target="_blank" @click.stop>{{ event.userId }}</a>
                    </span>
                </div>
                <div class="col-sm-3 small d-flex justify-content-start">
                    <span v-if="event.qualityAssuranceCheckers">
                        <a 
                            v-for="user in event.qualityAssuranceCheckers"
                            :key="user.id" 
                            :href="'https://osu.ppy.sh/users/' + user.osuId"
                            target="_blank"
                        >
                            <img
                                class="rounded-circle mx-1"
                                style="height:36px; width: 36px;"
                                :src="'https://a.ppy.sh/' + user.osuId"
                                data-toggle="tooltip"
                                :title="user.username"
                            >
                        </a>
                    </span>
                </div>
                <div class="col-sm-1 small d-flex justify-content-end">
                    <button 
                        v-if="event.qualityAssuranceCheckers && isQualityAssuranceChecker" 
                        data-toggle="tooltip" 
                        data-placement="top" 
                        title="toggle QA checker"
                        class="btn btn-xs btn-nat-red p-1"
                        @click.prevent="unassignUser($event)"
                    >
                        <i class="fas fa-minus vote-fail" />
                    </button>
                    <button 
                        v-else
                        data-toggle="tooltip"
                        data-placement="top"
                        title="toggle QA checker"
                        class="btn btn-xs btn-nat-green p-1"
                        @click.prevent="assignUser($event)"
                    >
                        <i class="fas fa-plus vote-pass" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'event-row',
    mixins: [postData],
    props: {
        event: Object,
        userId: String,
    },
    computed: {
        isQualityAssuranceChecker() {
            let valid;
            this.event.qualityAssuranceCheckers.forEach(user => {
                if(user.id == this.userId){
                    valid = true;
                }
            });
            return valid;
        },
    },
    methods: {
        async assignUser (e) {
            const event = await this.executePost('/qualityAssurance/assignUser/' + this.event.id, {}, e);
            if (event) {
                if (event.error) {
                    this.info = event.error;
                } else {
                    this.$emit('update-event', event);
                }
            }
        },
        async unassignUser (e) {
            const event = await this.executePost('/qualityAssurance/unassignUser/' + this.event.id, {}, e);
            if (event) {
                if (event.error) {
                    this.info = event.error;
                } else {
                    this.$emit('update-event', event);
                }
            }
        },
    },
};
</script>

<style>
    .card:hover {
        transform: scale(1) !important;
        opacity: 1;
    }

    .card {
        min-height: 0px !important;
    }

    .bg-darker {
        background-color: #252525a6 !important;
    }

    .collapsing {
        -webkit-transition: none;
        transition: none;
        display: none;
    }

    .beatmap-thumbnail {
        width: 60px;
        height: 45px;
        border-bottom-left-radius: 5px;
        border-top-left-radius: 5px;
        box-shadow: 1px 1px 1px 1px rgb(12, 14, 17);
    }
</style>

