<template>
    <a :href="'https://osu.ppy.sh/users/' + osuId" target="_blank">
        {{ username }}
    </a>
</template>

<script>
export default {
    name: 'UserLink',
    props: {
        osuId: {
            type: Number,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
    },
};
</script>
