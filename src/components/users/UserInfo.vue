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
                    <duration
                        :bn-duration="user.bnDuration"
                        :nat-duration="user.natDuration"
                    />
                    <notes
                        v-if="isNat"
                        :user-id="user.id"
                    />
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
</template>

<script>
import ModalHeader from './info/ModalHeader.vue';
import Duration from './info/Duration.vue';
import Notes from './info/Notes.vue';
import FooterButtons from './info/FooterButtons.vue';

export default {
    name: 'UserInfo',
    components: {
        ModalHeader,
        Duration,
        Notes,
        FooterButtons
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