<template>
    <div>
        <div class="card static-card" :class="isMaxChecks || isOutdated || isQualityAssuranceChecker ? 'low-opacity' : ''">
            <div class="card-header min-spacing d-flex align-items-center">
                <div class="col-sm-6 mr-2 truncate" style="padding-left: 0px;">
                    <a 
                        :href="'https://osu.ppy.sh/beatmapsets/' + event.beatmapsetId" 
                        target="_blank"
                        class="text-shadow"
                    >
                        <img
                            class="beatmap-thumbnail mr-2"
                            :src="'https://b.ppy.sh/thumb/' + event.beatmapsetId + '.jpg'"
                        >
                        {{ event.metadata }}
                    </a>
                </div>
                <div class="col-sm-2 small d-flex align-items-center justify-content-start">
                    <p class="min-spacing">
                        <span class="small">Host</span><br>
                        <a :href="'https://osu.ppy.sh/users/' + event.hostId" target="_blank" class="ml-1" @click.stop>{{ event.hostName }}</a>
                    </p>
                </div>
                <div class="col-sm-1 small d-flex align-items-center">
                    <p class="min-spacing">
                        <span class="small">Due</span><br>
                        <span class="errors ml-1">{{ findDeadline(event.timestamp) }}</span>
                    </p>
                </div>
                <div class="col-sm-2 small d-flex justify-content-start truncate">
                    <span v-if="event.qualityAssuranceCheckers && isNat">
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
                    <span v-else-if="isQualityAssuranceChecker">
                        <a 
                            :href="'https://osu.ppy.sh/users/' + userOsuId"
                            target="_blank"
                        >
                            <img
                                class="rounded-circle mx-1"
                                style="height:36px; width: 36px;"
                                :src="'https://a.ppy.sh/' + userOsuId"
                                data-toggle="tooltip"
                                :title="username"
                            >
                        </a>
                    </span>
                </div>
                <div v-if="!isOutdated" class="col-sm-1 small d-flex justify-content-end">
                    <button 
                        v-if="isQualityAssuranceChecker" 
                        data-toggle="tooltip" 
                        data-placement="top" 
                        title="toggle QA checker"
                        class="btn btn-xs btn-nat-red p-1"
                        :disabled="forceDisabled"
                        @click.prevent="unassignUser($event)"
                    >
                        <i class="fas fa-minus vote-fail" />
                    </button>
                    <button 
                        v-else-if="!isMaxChecks"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="toggle QA checker"
                        class="btn btn-xs btn-nat-green p-1"
                        :disabled="forceDisabled"
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
    name: 'EventRow',
    mixins: [postData],
    props: {
        event: Object,
        userId: String,
        userOsuId: Number,
        username: String,
        isNat: Boolean,
        isOutdated: Boolean,
        isMaxChecks: Boolean,
    },
    data() {
        return {
            forceDisabled: false,
        };
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
        async assignUser () {
            this.forceDisabled = true;
            const event = await this.executePost('/qualityAssurance/assignUser/' + this.event.id, {});
            if (event) {
                if (event.error) {
                    this.info = event.error;
                } else {
                    this.$emit('update-event', event);
                }
                this.forceDisabled = false;
            }
        },
        async unassignUser () {
            this.forceDisabled = true;
            const event = await this.executePost('/qualityAssurance/unassignUser/' + this.event.id, {});
            if (event) {
                if (event.error) {
                    this.info = event.error;
                } else {
                    this.$emit('update-event', event);
                }
                this.forceDisabled = false;
            }
        },
        findDeadline(timestamp){
            let date = new Date(timestamp);
            date.setDate(date.getDate() + 7);
            return date.toISOString().slice(5,10);
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

    .low-opacity {
        opacity: 0.5 !important;
    }
</style>

