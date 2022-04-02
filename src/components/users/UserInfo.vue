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
                    :key="mode"
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
                />

                <resign
                    v-if="selectedUser.id == loggedInUser.id && loggedInUser.isBn"
                />

                <div v-if="loggedInUser.isNat">
                    <bn-evaluator-toggle />

                    <trial-nat-toggle />

                    <discord-id />

                    <user-group-toggle v-if="selectedUser.isBn || selectedUser.isNat" />

                    <modding-activity
                        :username="selectedUser.username"
                        class="mt-2"
                    />

                    <hr>

                    <notes />
                </div>
            </div>
            <div v-if="loggedInUser.isNat" />
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
import ModdingActivity from '../evaluations/info/currentBns/ModdingActivity.vue';
import UserActivity from '../evaluations/info/currentBns/userActivity/UserActivity.vue';
import Resign from './info/Resign.vue';
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
        ModdingActivity,
        UserActivity,
        Resign,
        ModalDialog,
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
