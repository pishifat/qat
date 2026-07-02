<template>
    <div>
        <p>
            <b>Total votes</b> ({{ selectedDiscussion.mediations.length }})
        </p>

        <ul v-if="loggedInUser.hasFullReadAccess">
            <li v-for="mediation in selectedDiscussion.mediations" :key="mediation.id" class="small">
                <user-link
                    v-if="mediation.mediator"
                    :username="mediation.mediator.username"
                    :osu-id="mediation.mediator.osuId"
                />
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import discussionStoreMixin from '../../../../mixins/discussionStore';
import UserLink from '../../../UserLink.vue';

export default {
    name: 'VotesActive',
    components: {
        UserLink,
    },
    mixins: [discussionStoreMixin],
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
};
</script>
