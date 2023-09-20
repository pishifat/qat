<template>
    <div class="card card-body text-center">
        <h3>
            Not found :(
        </h3>

        <hr>

        <router-link :to="{ name: 'home' }">
            home
        </router-link>
    </div>
</template>

<script>
export default {
    name: 'NotFound',
    // @ts-ignore
    metaInfo: {
        meta: [
            { property: 'og:title', content: 'not found :( · NAT/BN Management' },
            { property: 'og:description', content: 'The place for everything related to the Beatmap Nominators!' },
        ],
    },
};
</script>
