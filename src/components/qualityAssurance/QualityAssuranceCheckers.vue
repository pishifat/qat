<template>
    <div>
        <span v-if="showAll">
            <a
                v-for="check in qualityAssuranceChecks"
                :key="check.id"
                :href="'https://osu.ppy.sh/users/' + check.user.osuId"
                target="_blank"
                class="mx-1"
            >
                <img
                    class="avatar-img avatar-img--small"
                    :src="'https://a.ppy.sh/' + check.user.osuId"
                    data-bs-toggle="tooltip"
                    :title="`${check.user.username} (${check.mode})`"
                >
            </a>
        </span>

        <span v-else-if="isQualityAssuranceChecker">
            <a
                :href="'https://osu.ppy.sh/users/' + loggedInUser.osuId"
                target="_blank"
            >
                <img
                    class="avatar-img avatar-img--small"
                    :src="'https://a.ppy.sh/' + loggedInUser.osuId"
                    data-bs-toggle="tooltip"
                    :title="loggedInUser.username"
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
        qualityAssuranceChecks: {
            type: Array,
            default() {
                return [];
            },
        },
        showAll: Boolean,
        isQualityAssuranceChecker: Boolean,
    },
    computed: mapState([
        'loggedInUser',
    ]),
};
</script>
