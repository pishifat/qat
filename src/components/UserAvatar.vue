<template>
    <div class="d-flex flex-column align-items-center h-100 my-3 text-center" :class="alignStart ? '' : 'justify-content-center'">
        <a
            :href="'https://osu.ppy.sh/users/' + user.osuId"
            class="d-flex flex-column align-items-center mb-2"
        >
            <img :src="'https://a.ppy.sh/' + user.osuId" class="avatar-img mb-2">
            <b :class="textColor">{{ user.username }}</b>
        </a>

        <slot />
    </div>
</template>

<script>
export default {
    name: 'UserAvatar',
    props: {
        user: {
            type: Object,
            required: true,
        },
        textColor: {
            type: String,
            default: '',
        },
        alignStart: Boolean,
    },
};
</script>
