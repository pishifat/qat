<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search username...'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
            />
            <section class="row segment segment-solid my-1 mx-4">
                <div class="small">
                    <span class="filter-header">Sort by</span>
                    <a :class="sort.type === 'username' ? 'sorted' : 'unsorted'" href="#" @click.prevent="updateSorting('username')">Name</a>
                    <a :class="sort.type === 'bnDuration' ? 'sorted' : 'unsorted'" href="#" @click.prevent="updateSorting('bnDuration')">Time as BN</a>
                    <a :class="sort.type === 'natDuration' ? 'sorted' : 'unsorted'" href="#" @click.prevent="updateSorting('natDuration')">Time as NAT</a>
                </div>
            </section>

            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <user-card
                            v-for="user in paginatedUsers"
                            :key="user.id"
                            :user="user"
                        />
                    </transition-group>
                    <button
                        v-if="pagination.page > 1"
                        class="btn btn-sm btn-pags btn-pags-left"
                        type="button"
                        @click="showNewer()"
                    >
                        <i class="fas fa-angle-left px-1" />
                    </button>
                    <button
                        v-if="pagination.page < pagination.maxPages"
                        class="btn btn-sm btn-pags btn-pags-right"
                        type="button"
                        @click="showOlder()"
                    >
                        <i class="fas fa-angle-right px-1" />
                    </button>
                </div>
            </section>
            <!-- other tools -->
            <section class="segment segment-solid my-1 mx-4">
                <nat-activity />
                <bn-activity />
                <badges
                    v-if="isNat"
                />
                <potential-nat-info
                    v-if="isNat"
                />
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
