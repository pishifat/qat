<template>
    <div>
        <div v-for="user in users" :key=user.osuId>
            <b>
                    <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                -
                <span :class="user.accuracy >= 66 ? 'text-success' : user.accuracy >= 33 ? 'text-warning' : 'text-danger'">{{ user.accuracy }}%</span>
                <small>({{ user.correct }}/{{ user.correct + user.incorrect }})</small>
            </b>
            -
            <a data-toggle="collapse" :href="`#details${user.osuId}`"><small>details <i class="fas fa-angle-down" /></small></a>

            <div :id="`details${user.osuId}`" class="collapse">
                <ul>
                    <li class="text-success">
                        <b>{{ user.correct }} accurate vibes</b>
                    </li>
                    <li class="text-danger">
                        <b>{{ user.incorrect }} inaccurate vibes</b>
                    </li>
                    <li class="text-success">
                        {{ user.positiveVibes }} positive vibes
                    </li>
                    <li class="text-danger">
                        {{ user.negativeVibes }} negative vibes    
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'VibeCheckStats',
    components: {
        UserLink,
    },
    data() {
        return {
            users: null,
        };
    },
    mounted() {
        this.findVibeCheckStats();
    },
    methods: {
        async findVibeCheckStats() {
            const users = await this.$http.executeGet('/users/findVibeCheckStats/');

            if (users) {
                this.users = users.sort((a, b) => {
                if (a.accuracy > b.accuracy) return -1;
                if (a.accuracy < b.accuracy) return 1;

                return 0;
            });
            }
        },
    },
};
</script>
