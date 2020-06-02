<template>
    <div>
        <span v-if="showAll">
            <a
                v-for="user in qualityAssuranceCheckers"
                :key="user.id"
                :href="'https://osu.ppy.sh/users/' + user.osuId"
                target="_blank"
                class="mx-1"
            >
                <img
                    class="avatar-img avatar-img--small"
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
                    class="avatar-img avatar-img--small"
                    :src="'https://a.ppy.sh/' + userOsuId"
                    data-toggle="tooltip"
                    :title="username"
                >
            </a>
        </span>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'QualityAssuranceCheckers',
    props: {
        qualityAssuranceCheckers: {
            type: Array,
            default() {
                return [];
            },
        },
        showAll: Boolean,
        isQualityAssuranceChecker: Boolean,
    },
    computed: {
        ...mapState([
            'userOsuId',
            'username',
        ]),
    },
};
</script>
