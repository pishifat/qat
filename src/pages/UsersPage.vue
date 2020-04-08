<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :filter-mode.sync="filterMode"
                :filter-value.sync="filterValue"
                :placeholder="'username... (3+ characters)'"
                :options="['', 'osu', 'taiko', 'catch', 'mania']"
            />
            <section class="row segment segment-solid my-1 mx-4">
                <div class="small">
                    <span class="filter-header">Sort by</span>
                    <a :class="sortBy === 'username' ? 'sorted' : 'unsorted'" href="#" @click.prevent="sort('username')">Name</a>
                    <a :class="sortBy === 'bnDuration' ? 'sorted' : 'unsorted'" href="#" @click.prevent="sort('bnDuration')">Time as BN</a>
                    <a :class="sortBy === 'natDuration' ? 'sorted' : 'unsorted'" href="#" @click.prevent="sort('natDuration')">Time as NAT</a>
                </div>
            </section>

            <section class="row segment segment-image mx-0 px-0">
                <div class="col-sm-12">
                    <transition-group name="list" tag="div" class="row mx-auto">
                        <user-card
                            v-for="user in pageObjs"
                            :key="user.id"
                            :user="user"
                            :user-id="userId"
                            @update:selectedUser="selectedUser = $event"
                        />
                    </transition-group>
                    <button
                        v-if="pre > 0"
                        class="btn btn-sm btn-pags btn-pags-left"
                        type="button"
                        @click="showNewer()"
                    >
                        <i class="fas fa-angle-left px-1" />
                    </button>
                    <button
                        v-if="canShowOlder"
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

        <user-info
            :user="selectedUser"
            :user-id="userId"
            :is-nat="isNat"
            @update-user="updateUser($event)"
        />
    </div>
</template>

<script>
import UserCard from '../components/users/UserCard.vue';
import UserInfo from '../components/users/UserInfo.vue';
import NatActivity from '../components/users/NatActivity.vue';
import BnActivity from '../components/users/BnActivity.vue';
import Badges from '../components/users/Badges.vue';
import PotentialNatInfo from '../components/users/PotentialNatInfo.vue';
import FilterBox from '../components/FilterBox.vue';
import pagination from '../mixins/pagination.js';
import filters from '../mixins/filters.js';

export default {
    name: 'UsersPage',
    components: {
        UserCard,
        UserInfo,
        NatActivity,
        BnActivity,
        Badges,
        PotentialNatInfo,
        FilterBox,
    },
    mixins: [pagination, filters],
    data() {
        return {
            pageObjs: null,
            allObjs: null,
            filteredObjs: null,
            userId: null,
            isNat: null,
            isBn: null,
            selectedUser: null,
        };
    },
    created() {
        axios
            .get('/users/relevantInfo')
            .then(response => {
                this.allObjs = response.data.users;
                this.userId = response.data.userId;
                this.isNat = response.data.isNat;
                this.isBn = response.data.isBn;
                this.limit = 24;
                const params = new URLSearchParams(document.location.search.substring(1));

                if (params.get('id') && params.get('id').length) {
                    const i = this.allObjs.findIndex(u => u.id == params.get('id'));

                    if (i >= 0) {
                        this.selectedUser = this.allObjs[i];
                        $('#extendedInfo').modal('show');
                    }
                }
            }).then(function() {
                $('#loading').fadeOut();
                $('#main').attr('style', 'visibility: visible').hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/users/relevantInfo')
                .then(response => {
                    this.allObjs = response.data.users;

                    if (this.isFiltered) {
                        this.filter();
                    }
                });
        }, 300000);
    },
    methods: {
        filterBySearchValueContext(u) {
            if (u.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1) {
                return true;
            }

            return false;
        },
        updateUser(u) {
            const i = this.pageObjs.findIndex(user => user.id == u.id);
            this.pageObjs[i] = u;
            this.selectedUser = u;
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
