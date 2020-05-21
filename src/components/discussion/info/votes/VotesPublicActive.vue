<template>
    <div>
        <p class="min-spacing text-shadow">
            Total votes ({{ selectedDiscussionVote.mediations.length }}):
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
    name: 'VotesPublicActive',
    computed: {
        ...mapGetters([
            'selectedDiscussionVote',
        ]),
    },
};
</script>