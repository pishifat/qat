<template>
    <modal-dialog id="extendedInfo">
        <template v-if="selectedUser" #header>
            <modal-header />
        </template>

        <div v-if="selectedUser" class="container">
            <duration />

            <div v-if="selectedUser.isBn || selectedUser.isNat">
                <next-evaluation
                    v-for="mode in selectedUser.modes"
                    :key="mode + selectedUser.osuId"
                    :mode="mode"
                    :mongo-id="selectedUser.id"
                />
                <hr>

                <user-activity
                    :modes="selectedUser.modes"
                    :deadline="new Date().toString()"
                    :osu-id="selectedUser.osuId"
                    :mongo-id="selectedUser.id"
                    :unique="selectedUser.id"
                    :overwrite-days="90"
                    :show-archive="true"
                    :is-nat="selectedUser.isNat"
                />

                <div v-for="mode in selectedUser.modes" :key="mode">
                    <resign
                        v-if="selectedUser.id == loggedInUser.id && loggedInUser.isBn"
                        :mode="mode"
                        class="mb-2"
                    />
                </div>

                <div v-if="loggedInUser.isNat">
                    <bn-evaluator-toggle />

                    <trial-nat-toggle v-if="selectedUser.isBn && selectedUser.fullModes.length" />

                    <discord-id />

                    <div v-for="mode in selectedUser.modes" :key="mode">
                        <user-group-toggle
                            v-if="selectedUser.isBn"
                            :mode="mode"
                        />
                    </div>

                    <nat-subgroup-toggle 
                        v-if="loggedInUser.isResponsibleWithButtons && selectedUser.isNat" 
                    />

                    <modding-activity
                        :username="selectedUser.username"
                        class="mt-2"
                    />

                    <badges
                        :user="selectedUser" 
                    />
                </div>
            </div>

            <div v-if="loggedInUser.isNat && !selectedUser.isBnOrNat">
                <ban-toggle />

                <former-user-group-toggle />
            </div>

            <div v-if="loggedInUser.isNat">
                <hr> 
                <notes />
            </div>

            <div v-if="loggedInUser.isPishifat">
                <hr />
                <b>Debug</b>
                <div class="ml-4">
                    <a href="#userDocument" data-toggle="collapse">
                        view user document <i class="fas fa-angle-down" />
                    </a>
                    <pre id="userDocument" class="collapse container text-white">{{ JSON.stringify(selectedUser, null, 4) }}</pre>
                </div>
            </div>
        </div>
    </modal-dialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import ModalHeader from './info/ModalHeader.vue';
import Duration from './info/Duration.vue';
import Notes from './info/Notes.vue';
import DiscordId from './info/DiscordId.vue';
import NextEvaluation from './info/NextEvaluation.vue';
import BnEvaluatorToggle from './info/BnEvaluatorToggle.vue';
import TrialNatToggle from './info/TrialNatToggle.vue';
import UserGroupToggle from './info/UserGroupToggle.vue';
import FormerUserGroupToggle from './info/FormerUserGroupToggle.vue';
import NatSubgroupToggle from './info/NatSubgroupToggle.vue';
import ModdingActivity from '../evaluations/info/currentBns/ModdingActivity.vue';
import UserActivity from '../evaluations/info/currentBns/userActivity/UserActivity.vue';
import Resign from './info/Resign.vue';
import BanToggle from './info/BanToggle.vue';
import Badges from './Badges.vue';
import ModalDialog from '../ModalDialog.vue';

export default {
    name: 'UserInfo',
    components: {
        ModalHeader,
        Duration,
        Notes,
        DiscordId,
        NextEvaluation,
        BnEvaluatorToggle,
        TrialNatToggle,
        UserGroupToggle,
        FormerUserGroupToggle,
        NatSubgroupToggle,
        ModdingActivity,
        UserActivity,
        Resign,
        BanToggle,
        ModalDialog,
        Badges,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('users', [
            'selectedUser',
        ]),
    },
};
</script>
