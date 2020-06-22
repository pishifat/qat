<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search username...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
                store-module="users"
            >
                <div class="sort-filter">
                    <span class="sort-filter__title">Sort by</span>
                    <a
                        class="sort-filter__item"
                        :class="sort.type === 'username' ? 'sort-filter__item--selected' : ''"
                        href="#"
                        @click.prevent="updateSorting('username')"
                    >
                        Name
                    </a>
                    <a
                        class="sort-filter__item"
                        :class="sort.type === 'bnDuration' ? 'sort-filter__item--selected' : ''"
                        href="#"
                        @click.prevent="updateSorting('bnDuration')"
                    >
                        Time as BN
                    </a>
                    <a
                        class="sort-filter__item"
                        :class="sort.type === 'natDuration' ? 'sort-filter__item--selected' : ''"
                        href="#"
                        @click.prevent="updateSorting('natDuration')"
                    >
                        Time as NAT
                    </a>
                    <!-- uncomment after importing ex BNs
                    <button v-if="!showOldUsers" class="btn btn-primary btn-sm ml-2 float-right" @click="loadPreviousBnAndNat($event)">
                        Show previous BN/NAT
                    </button>
                    -->
                </div>
            </filter-box>

            <section class="card card-body">
                <transition-group name="list" tag="div" class="row">
                    <user-card
                        v-for="user in paginatedUsers"
                        :key="user.id"
                        :user="user"
                    />
                </transition-group>

                <pagination-nav
                    store-module="users"
                />
            </section>

            <!-- other tools -->
            <section class="card card-body">
                <nat-activity class="my-2" />
                <bn-activity classs="my-2" />

                <template v-if="loggedInUser.isNat">
                    <badges />
                    <potential-nat-info />
                </template>
            </section>
        </div>

        <user-info />

        <toast-messages />
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import usersModule from '../store/users';
import ToastMessages from '../components/ToastMessages.vue';
import UserCard from '../components/users/UserCard.vue';
import UserInfo from '../components/users/UserInfo.vue';
import NatActivity from '../components/users/NatActivity.vue';
import BnActivity from '../components/users/BnActivity.vue';
import Badges from '../components/users/Badges.vue';
import PotentialNatInfo from '../components/users/PotentialNatInfo.vue';
import FilterBox from '../components/FilterBox.vue';
import PaginationNav from '../components/PaginationNav.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'UsersPage',
    components: {
        ToastMessages,
        UserCard,
        UserInfo,
        NatActivity,
        BnActivity,
        Badges,
        PotentialNatInfo,
        FilterBox,
        PaginationNav,
    },
    mixins: [postData],
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('users', [
            'users',
            'sort',
            'showOldUsers',
        ]),
        ...mapGetters('users', [
            'paginatedUsers',
            'sortedUsers',
        ]),
    },
    watch: {
        sortedUsers (v) {
            this.$store.dispatch('users/pagination/updateMaxPages', v.length);
        },
    },
    beforeCreate () {
        if (!this.$store.hasModule('users')) {
            this.$store.registerModule('users', usersModule);
        }
    },
    async created() {
        if (this.users.length) return;

        const data = await this.initialRequest('/users/relevantInfo');

        if (!data.error) {
            this.$store.commit('users/setUsers', data.users);

            const id = this.$route.query.id;

            if (id) {
                let i = this.users.findIndex(u => u.id == id);

                if (i == -1) {
                    await this.loadPreviousBnAndNat();
                    i = this.users.findIndex(u => u.id == id);
                }

                if (i >= 0) {
                    this.$store.commit('users/setSelectedUserId', id);
                    $('#extendedInfo').modal('show');
                }
            }
        }
    },
    methods: {
        updateSorting(sortBy) {
            this.$store.dispatch('users/updateSorting', sortBy);
        },
        async loadPreviousBnAndNat(e) {
            const res = await this.executeGet('/users/loadPreviousBnAndNat', e);

            if (res) {
                this.$store.commit('users/setShowOldUsers', true);
                this.$store.commit('users/setUsers', res.users);
                this.$store.dispatch('users/pageFilters/setFilterMode', '');
            }
        },
    },
};
</script>

<style>
/* these are used in BN activity and badge sections */

.background-pass {
    background-color: rgba(50,255,50,0.25);
}

.background-warn {
    background-color: rgba(255,255,0,0.25);
}

.background-fail {
    background-color: rgba(255,50,50,0.25);
}

</style>
