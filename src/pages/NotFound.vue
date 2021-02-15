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
};
</script>
