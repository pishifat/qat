<template>
    <section class="card card-body">
        <a data-toggle="collapse" href="#leaderboard" @click="loadLeaderboard()">QA check stats <i class="fas fa-angle-down" /></a>

        <div id="leaderboard" class="collapse mt-4 mx-4">
            <div v-if="!leaderboard" class="small">
                loading...
            </div>
            <div v-else class="row">
                <div v-for="(data, i) in leaderboard" :key="i" class="col-sm-3">
                    <div class="card px-2">
                        <p class="font-weight-bold text-center mt-1">
                            {{ data.mode | formatMode }}
                        </p>
                        <div v-if="data.recentDisplayUsers.length">
                            <p class="ml-2">
                                recent (last 7 days)
                            </p>
                            <ol class="small">
                                <li v-for="user in data.recentDisplayUsers" :key="user.id">
                                    <user-link
                                        :osu-id="user.osuId"
                                        :username="user.username"
                                    />
                                    -
                                    <span class="font-weight-bold">{{ user.recentQaChecks }}</span>
                                </li>
                            </ol>
                        </div>
                        <p class="ml-2">
                            overall
                        </p>
                        <ol class="small">
                            <li v-for="user in data.overallDisplayUsers" :key="user.id">
                                <user-link
                                    :osu-id="user.osuId"
                                    :username="user.username"
                                />
                                -
                                <span class="font-weight-bold">{{ user.allQaChecks }}</span>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import { mapState } from 'vuex';
import UserLink from '../UserLink.vue';

export default {
    name: 'Leaderboard',
    components: {
        UserLink,
    },
    data () {
        return {
            leaderboard: null,
            loading: false,
        };
    },
    computed: {
        ...mapState('qualityAssurance', [
            'pageFilters',
        ]),
    },
    methods: {
        async loadLeaderboard () {
            if (!this.leaderboard && !this.loading) {
                this.loading = true;
                const data = await this.$http.executeGet('/qualityAssurance/loadLeaderboard');

                if (this.$http.isValid(data)) {
                    this.loading = false;
                    this.leaderboard = data;
                }
            }
        },
    },
};
</script>
