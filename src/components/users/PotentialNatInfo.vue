<template>
    <div class="mb-2">
        <button
            v-if="!potentialNatInfo.length"
            class="btn btn-sm btn-primary my-1"
            @click="findPotentialNatInfo($event)"
        >
            Load BN evaluation stats
        </button>

        <div v-if="potentialNatInfo.length">
            osu
            <div v-for="user in osuUsers" :key="user.osuId + 'osu'" class="small my-2 ml-2 row">
                <a
                    href="#"
                    data-toggle="modal"
                    data-target="#extendedInfo"
                    @click="selectUser(user)"
                >
                    {{ user.username }}
                </a>
                <div>: {{ user.evaluatedApps }}</div>
            </div>
            taiko
            <div v-for="user in taikoUsers" :key="user.osuId + 'taiko'" class="small my-2 ml-2 row">
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                <div>: {{ user.evaluatedApps }}</div>
            </div>
            catch
            <div v-for="user in catchUsers" :key="user.osuId + 'catch'" class="small my-2 ml-2 row">
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                <div>: {{ user.evaluatedApps }}</div>
            </div>
            mania
            <div v-for="user in maniaUsers" :key="user.osuId + 'mania'" class="small my-2 ml-2 row">
                <user-link
                    :osu-id="user.osuId"
                    :username="user.username"
                />
                <div>: {{ user.evaluatedApps }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'PotentialNatInfo',
    components: {
        UserLink,
    },
    data() {
        return {
            potentialNatInfo: [],
        };
    },
    computed: {
        /** @returns {Array} */
        osuUsers () {
            return this.potentialNatInfo.filter(u => u.modes.includes('osu'));
        },
        /** @returns {Array} */
        taikoUsers () {
            return this.potentialNatInfo.filter(u => u.modes.includes('taiko'));
        },
        /** @returns {Array} */
        catchUsers () {
            return this.potentialNatInfo.filter(u => u.modes.includes('catch'));
        },
        /** @returns {Array} */
        maniaUsers () {
            return this.potentialNatInfo.filter(u => u.modes.includes('mania'));
        },
    },
    methods: {
        async findPotentialNatInfo(e) {
            const users = await this.$http.executeGet('/users/nat/findPotentialNatInfo/', e);

            if (users) {
                users.forEach(user => {
                    if (user.evaluatedApps) {
                        this.potentialNatInfo.push(user);
                    }
                });
            }
        },
        selectUser(user) {
            this.$store.commit('users/setSelectedUserId', user.id);

            if (this.$route.query.id !== user.id) {
                this.$router.replace(`/users?id=${user.id}`);
            }
        },
    },
};
</script>
