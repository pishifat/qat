<template>
    <div>
        <p class="min-spacing my-2">
            {{ agreeMediations.length }} "Agree" {{ agreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((agreeMediations.length/totalMediations)*100) || 0 }}%)
        </p>
        <p v-for="mediation in agreeMediations" :key="mediation.id" class="small min-spacing ml-2">
            {{ mediation.mediator.username }}
        </p>
        <p class="min-spacing my-2">
            {{ neutralMediations.length }} "Neutral" {{ neutralMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((neutralMediations.length/totalMediations)*100) || 0 }}%)
        </p>
        <p v-for="mediation in neutralMediations" :key="mediation.id" class="small min-spacing ml-2">
            {{ mediation.mediator.username }}
        </p>
        <p class="min-spacing my-2">
            {{ disagreeMediations.length }} "Disagree" {{ disagreeMediations.length == 1 ? 'vote' : 'votes' }} ({{ Math.round((disagreeMediations.length/totalMediations)*100) || 0 }}%)
        </p>
        <p v-for="mediation in disagreeMediations" :key="mediation.id" class="small min-spacing ml-2">
            {{ mediation.mediator.username }}
        </p>
    </div>
</template>

<script>
export default {
    name: 'VotesLeaderActive',
    props: {
        agreeMediations: Array,
        neutralMediations: Array,
        disagreeMediations: Array,
    },
    computed: {
        totalMediations() {
            return this.agreeMediations.length + this.neutralMediations.length + this.disagreeMediations.length;
        },
    },
};
</script>