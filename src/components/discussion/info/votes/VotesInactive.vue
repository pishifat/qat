<template>
    <div>
        <p class="min-spacing my-2 text-shadow">
            {{ agreeMediations.length }} "Agree" {{ agreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((agreeMediations.length/totalMediations)*100) || 0 }}%)
        </p>
        <ul v-if="isNatOnlyOrLeader">
            <li v-for="mediation in agreeMediations" :key="mediation.id" class="small ml-2">
                {{ mediation.mediator.username }}:
                <pre v-if="mediation.comment && mediation.comment.length" class="secondary-text pre-font ml-2">{{ mediation.comment }}</pre>
            </li>
        </ul>
        <p class="min-spacing my-2 text-shadow">
            {{ neutralMediations.length }} "Neutral" {{ neutralMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((neutralMediations.length/totalMediations)*100) || 0 }}%)
        </p>
        <ul v-if="isNatOnlyOrLeader">
            <li v-for="mediation in neutralMediations" :key="mediation.id" class="small ml-2">
                {{ mediation.mediator.username }}:
                <pre v-if="mediation.comment && mediation.comment.length" class="secondary-text pre-font ml-2">{{ mediation.comment }}</pre>
            </li>
        </ul>
        <p class="min-spacing my-2 text-shadow">
            {{ disagreeMediations.length }} "Disagree" {{ disagreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((disagreeMediations.length/totalMediations)*100) || 0 }}%)
        </p>
        <ul v-if="isNatOnlyOrLeader">
            <li v-for="mediation in disagreeMediations" :key="mediation.id" class="small ml-2">
                {{ mediation.mediator.username }}:
                <pre v-if="mediation.comment && mediation.comment.length" class="secondary-text pre-font ml-2">{{ mediation.comment }}</pre>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'VotesInactive',
    props: {
        isNatOnlyOrLeader: Boolean,
        agreeMediations: {
            type: Array,
            default() {
                return [];
            },
        },
        neutralMediations: {
            type: Array,
            default() {
                return [];
            },
        },
        disagreeMediations: {
            type: Array,
            default() {
                return [];
            },
        },
    },
    computed: {
        totalMediations() {
            return this.agreeMediations.length + this.neutralMediations.length + this.disagreeMediations.length;
        },
    },
};
</script>