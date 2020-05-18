<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="selectedUser" class="modal-content">
                <modal-header />
                <div class="modal-body">
                    <div class="container">
                        <duration />
                        <next-evaluation />
                        <hr>
                        <div v-for="mode in selectedUser.modes" :key="mode">
                            <p class="text-shadow min-spacing mb-1">
                                Recent BN activity
                                <span class="small">({{ mode == 'osu' ? 'osu!' : 'osu!' + mode }})</span>
                            </p>
                            <div class="container mb-3">
                                <user-activity
                                    :mode="mode"
                                    :deadline="new Date().toString()"
                                />
                            </div>
                        </div>
                        <modding-activity
                            v-if="isNat"
                            class="mt-2"
                        />

                        <!-- BN can only see this on their own cards. NAT can see on everyone's cards -->
                        <bn-evaluator-toggle
                            v-if="(selectedUser.id == userId || isNat) && selectedUser.group != 'nat'"
                        />

                        <notes
                            v-if="isNat"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
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
    computed: {
        ...mapState([
            'userId',
            'isNat',
        ]),
        ...mapGetters([
            'selectedUser',
        ]),
    },
    watch: {
        selectedUser() {
            history.pushState(null, 'BN/NAT Listing', `/users?id=${this.selectedUser.id}`);
        },
    },
};
</script>