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
                        <notes
                            v-if="isNat"
                            :user-id="user.id"
                        />
                        <p class="text-shadow min-spacing mb-1">BN activity (last 3 months):</p>
                        <div class="container">
                            <user-activity
                                :osu-id="user.osuId"
                                :mode="user.modes[0]"
                                :deadline="new Date().toString()"
                                :is-nat="isNat"
                            />
                        </div>
                        <footer-buttons
                            :is-leader="isLeader"
                            :group="user.group"
                            :is-bn-evaluator="user.isBnEvaluator"
                            :is-current-user="user.id == userId"
                            :user-id="user.id"
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
import FooterButtons from './info/FooterButtons.vue';
import UserActivity from '../evaluations/currentBnEvaluations/currentBnInfo/UserActivity.vue'

export default {
    name: 'UserInfo',
    components: {
        ModalHeader,
        Duration,
        Notes,
        FooterButtons,
        UserActivity
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