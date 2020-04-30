<template>
    <div class="mt-2 d-flex justify-content-start truncate">
        <span v-if="showAll">
            <a
                v-for="user in qualityAssuranceCheckers"
                :key="user.id"
                :href="'https://osu.ppy.sh/users/' + user.osuId"
                target="_blank"
            >
                <img
                    class="rounded-circle mx-1 card-avatar-img"
                    :src="'https://a.ppy.sh/' + user.osuId"
                    data-toggle="tooltip"
                    :title="user.username"
                >
            </a>
        </span>
        <span v-else-if="isQualityAssuranceChecker">
            <a
                :href="'https://osu.ppy.sh/users/' + userOsuId"
                target="_blank"
            >
                <img
                    class="rounded-circle mx-1 card-avatar-img"
                    :src="'https://a.ppy.sh/' + userOsuId"
                    data-toggle="tooltip"
                    :title="username"
                >
            </a>
        </span>
    </div>
</template>

<script>
export default {
    name: 'QualityAssuranceCheckers',
    props: {
        qualityAssuranceCheckers: {
            type: Array,
            default() {
                return [];
            },
        },
        userOsuId: {
            type: Number,
            default: 0,
        },
        username: {
            type: String,
            default: '',
        },
        showAll: Boolean,
        isQualityAssuranceChecker: Boolean,
    },
};
</script>

<style scoped>
    .card-avatar-img {
        max-width: 36px;
        max-height: 36px;
        object-fit: cover;
        border-radius: 100%;
        box-shadow: 0 1px 0.5rem rgba(10, 10, 25);
        background-color: rgba(10, 10, 25);
    }
</style>