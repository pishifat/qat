<template>
    <div>
        <p>
            <b>Total votes</b> ({{ selectedDiscussionVote.mediations.length }}):
        </p>
        <ul>
            <li v-for="mediation in selectedDiscussionVote.mediations" :key="mediation.id" class="small">
                {{ mediation.mediator.username }}
            </li>
        </ul>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
    name: 'VotesNatOnlyActive',
    computed: {
        ...mapGetters([
            'selectedDiscussionVote',
        ]),
    },
};
</script>