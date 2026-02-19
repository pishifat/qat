<template>
    <div>
        <button v-if="!users" class="btn btn-sm btn-primary my-2" @click="findVibeCheckStats($event)">
            Load vibes
        </button>
        <button v-else class="btn btn-sm btn-primary my-2" @click="natFilter = !natFilter">
            {{ natFilter ? 'Show all' : 'Show NAT only' }}
        </button>
        <div v-for="user in users" v-if="!natFilter || user.isNat" :key="user.osuId">
            <b>
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                —
                <span :class="user.accuracy >= 66 ? 'text-success' : user.accuracy >= 33 ? 'text-warning' : 'text-danger'">{{ user.accuracy }}%</span>
                <small>({{ user.correct }}/{{ user.correct + user.incorrect }})</small>
            </b>
            -
            <a data-bs-toggle="collapse" :href="`#details${user.osuId}`"><small>details <i class="fas fa-angle-down" /></small></a>

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
            natFilter: true,
        };
    },
    methods: {
        async findVibeCheckStats(e) {
            const users = await this.$http.executeGet('/users/findVibeCheckStats', e);

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
