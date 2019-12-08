<template>
    <div class="card-body mx-1">
        <p class="card-text text-shadow">
            <a :href="'https://osu.ppy.sh/users/' + osuId" target="_blank" @click.stop>
                {{ username }}
            </a>
        </p>
    </div>
</template>

<script>
export default {
    name: 'card-header',
    props: {
        username: String,
        osuId: Number,
    },
};
</script>