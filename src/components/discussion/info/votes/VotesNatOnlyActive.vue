<template>
    <div>
        <p class="min-spacing my-2">
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
    name: 'VotesNatOnlyActive',
    props: {
        mediations: Array,
    },
};
</script>