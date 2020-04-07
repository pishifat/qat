<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="user" class="modal-content">
                <modal-header
                    :osu-id="user.osuId"
                    :username="user.username"
                    :modes="user.modes"
                    :group="user.group"
                    :probation="user.probation"
                />
                <div class="modal-body">
                    <div class="container">
                        <duration
                            :bn-duration="user.bnDuration"
                            :nat-duration="user.natDuration"
                        />
                        <next-evaluation
                            :user-id="user.id"
                        />
                        <hr>
                        <span v-for="(mode, i) in user.modes" :key="mode">
                            <p class="text-shadow min-spacing mb-1">Recent BN activity
                                <span class="small">({{ mode == 'osu' ? 'osu!' : 'osu!' + mode }})</span>
                            </p>
                            <div class="container mb-3">
                                <user-activity
                                    :osu-id="user.osuId"
                                    :mode="user.modes[i]"
                                    :deadline="new Date().toString()"
                                    :is-nat="isNat"
                                    :user-mongo-id="user.id"
                                />
                                <modding-activity
                                    v-if="isNat"
                                    class="mt-2"
                                    :username="user.username"
                                />
                            </div>
                        </span>
                        <bn-evaluator-toggle
                            v-if="(user.id == userId || isNat) && user.group != 'nat'"
                            :is-bn-evaluator="user.isBnEvaluator"
                            :user-id="user.id"
                            @update-user="$emit('update-user', $event);"
                        />
                        <notes
                            v-if="isNat"
                            :user-id="user.id"
                            :viewing-user="userId"
                            @update-user="$emit('update-user', $event);"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import ModalHeader from './info/ModalHeader.vue';
import Duration from './info/Duration.vue';
import Notes from './info/Notes.vue';
import NextEvaluation from './info/NextEvaluation.vue';
import BnEvaluatorToggle from './info/BnEvaluatorToggle.vue';
import ModdingActivity from '../evaluations/currentBnEvaluations/currentBnInfo/ModdingActivity.vue';
import UserActivity from '../evaluations/currentBnEvaluations/currentBnInfo/UserActivity.vue';

export default {
    name: 'UserInfo',
    components: {
        ModalHeader,
        Duration,
        Notes,
        NextEvaluation,
        BnEvaluatorToggle,
        ModdingActivity,
        UserActivity,
    },
    props: {
        user: Object,
        userId: String,
        isLeader: Boolean,
        isNat: Boolean,
    },
    watch: {
        user() {
            history.pushState(null, 'BN/NAT Listing', `/users?id=${this.user.id}`);
        },
    },
};
</script>