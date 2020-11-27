<template>
    <div>
        <p>
            <b>Total votes</b> ({{ selectedDiscussionVote.mediations.length }}):
        </p>

        <ul v-if="loggedInUser.isNat">
            <li v-for="mediation in selectedDiscussionVote.mediations" :key="mediation.id" class="small">
                <user-link
                    :username="mediation.mediator.username"
                    :osu-id="mediation.mediator.osuId"
                />
            </li>
        </ul>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import UserLink from '../../../UserLink.vue';

export default {
    name: 'VotesActive',
    components: {
        UserLink,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('discussionVote', [
            'selectedDiscussionVote',
        ]),
    },
};
</script>
