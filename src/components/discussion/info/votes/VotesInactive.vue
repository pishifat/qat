<template>
    <div>
        <!-- agree -->
        <p class="min-spacing my-2 text-shadow">
            {{ agreeMediations.length }} "Agree" {{ agreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((agreeMediations.length/totalMediations)*100) || 0 }}%)
        </p>
        <ul v-if="isNat">
            <li v-for="mediation in agreeMediations" :key="mediation.id" class="small ml-2">
                {{ mediation.mediator.username }}
                <pre v-if="mediation.comment && mediation.comment.length" class="secondary-text pre-font ml-2">{{ mediation.comment }}</pre>
            </li>
        </ul>

        <!-- neutral -->
        <div v-if="selectedDiscussionVote.neutralAllowed">
            <p class="min-spacing my-2 text-shadow">
                {{ neutralMediations.length }} "Neutral" {{ neutralMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((neutralMediations.length/totalMediations)*100) || 0 }}%)
            </p>
            <ul v-if="isNat">
                <li v-for="mediation in neutralMediations" :key="mediation.id" class="small ml-2">
                    {{ mediation.mediator.username }}
                    <pre v-if="mediation.comment && mediation.comment.length" class="secondary-text pre-font ml-2">{{ mediation.comment }}</pre>
                </li>
            </ul>
        </div>

        <!-- disagree -->
        <p class="min-spacing my-2 text-shadow">
            {{ disagreeMediations.length }} "Disagree" {{ disagreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((disagreeMediations.length/totalMediations)*100) || 0 }}%)
        </p>
        <ul v-if="isNat">
            <li v-for="mediation in disagreeMediations" :key="mediation.id" class="small ml-2">
                {{ mediation.mediator.username }}
                <pre v-if="mediation.comment && mediation.comment.length" class="secondary-text pre-font ml-2">{{ mediation.comment }}</pre>
            </li>
        </ul>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'VotesInactive',
    computed: {
        ...mapState([
            'isNat',
        ]),
        ...mapGetters([
            'selectedDiscussionVote',
        ]),
        totalMediations() {
            return this.agreeMediations.length + this.neutralMediations.length + this.disagreeMediations.length;
        },
        agreeMediations() {
            return this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 1);
        },
        neutralMediations() {
            return this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 2);
        },
        disagreeMediations() {
            return this.selectedDiscussionVote.mediations.filter(mediation => mediation.vote == 3);
        },
    },
};
</script>