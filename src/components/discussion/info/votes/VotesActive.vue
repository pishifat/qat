<template>
    <div>
        <p>
            <b>Total votes</b> ({{ selectedDiscussionVote.mediations.length }}):
        </p>

        <ul v-if="isNat">
            <li v-for="mediation in selectedDiscussionVote.mediations" :key="mediation.id" class="small">
                {{ mediation.mediator.username }}
            </li>
        </ul>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
export default {
    name: 'VotesActive',
    computed: {
        ...mapGetters([
            'selectedDiscussionVote',
        ]),
        ...mapState([
            'isNat',
        ]),
    },
};
</script>
