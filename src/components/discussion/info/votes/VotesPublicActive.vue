<template>
    <div>
        <p class="min-spacing text-shadow">
            Total votes ({{ mediations.length }}):
        </p>
        <ul>
            <li v-for="mediation in mediations" :key="mediation.id" class="small">
                {{ mediation.mediator.username }}
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'VotesPublicActive',
    props: {
        mediations: Array,
    },
};
</script>