<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search username...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
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
                    @show-newer="showNewer()"
                    @show-older="showOlder()"
                />
            </section>

            <!-- other tools -->
            <section class="card card-body">
                <nat-activity class="my-2" />
                <bn-activity classs="my-2" />

                <template v-if="isNat">
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
            'userId',
            'isNat',
            'pagination',
            'sort',
        ]),
        ...mapGetters([
            'paginatedUsers',
            'allUsers',
        ]),
    },
    watch: {
        paginatedUsers () {
            this.$store.dispatch('updatePaginationMaxPages');
        },
    },
    async created() {
        const res = await this.executeGet('/users/relevantInfo');

        if (res) {
            this.$store.commit('setUsers', res.users);
            this.$store.commit('setUserId', res.userId);
            this.$store.commit('setIsNat', res.isNat);

            const params = new URLSearchParams(document.location.search.substring(1));

            if (params.get('id') && params.get('id').length) {
                const i = this.allUsers.findIndex(u => u.id == params.get('id'));

                if (i >= 0) {
                    this.$store.commit('setSelectedUserId', params.get('id'));
                    $('#extendedInfo').modal('show');
                }
            }
        }

        $('#loading').fadeOut();
        $('#main').attr('style', 'visibility: visible').hide().fadeIn();
    },
    methods: {
        showOlder() {
            this.$store.commit('increasePaginationPage');
        },
        showNewer() {
            this.$store.commit('decreasePaginationPage');
        },
        updateSorting(sortBy) {
            this.$store.dispatch('updateSorting', sortBy);
        },
        sortDuration(dateArray) {
            let days = 0;

            for (let i = 0; i < dateArray.length; i+=2) {
                let a = new Date(dateArray[i]);
                let b = new Date(dateArray[i+1]);

                if (dateArray[i+1]) {
                    days += (Math.abs(b.getTime() - a.getTime())) / (1000 * 3600 * 24);
                } else {
                    days += (Math.abs(new Date().getTime() - a.getTime())) / (1000 * 3600 * 24);
                }
            }

            return days;
        },
    },
};
</script>

<style>
/* these are used in BN activity and badge sections */

.background-pass {
    background-color: rgb(50,255,50,0.25);
}

.background-warn {
    background-color: rgb(255,255,0,0.25);
}

.background-fail {
    background-color: rgb(255,50,50,0.25);
}

</style>
