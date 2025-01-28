<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box
                :placeholder="'enter to search username...'"
                :modes="['', 'osu', 'taiko', 'catch', 'mania']"
                :groups="['', 'bn', 'nat']"
                store-module="users"
            >
                <div v-if="loggedInUser && loggedInUser.isNat" class="row">
                    <div class="col-sm-4 input-group">
                        <input
                            id="search"
                            v-model="userInput"
                            class="form-control"
                            type="text"
                            autocomplete="off"
                            placeholder="open card for username or osu ID..."
                            @keyup.enter="openUserModal($event)"
                        >
                        <div class="input-group-append">
                            <button class="btn btn-sm btn-primary px-3" @click="openUserModal($event)">
                                <i class="fas fa-external-link-alt" />
                            </button>
                        </div>
                    </div>
                </div>
                <div class="sort-filter sort-filter--small">
                    <span class="sort-filter__title">Sort by</span>
                    <div class="sort-filter__items">
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

                    <button v-if="loggedInUser && loggedInUser.isNat && !showOldUsers" class="btn btn-primary btn-sm ml-2 float-right" @click="loadBannedUsers($event)">
                        Show users banned from BN
                    </button>
                    
                    <button v-if="!showOldUsers" class="btn btn-primary btn-sm ml-2 float-right" @click="loadPreviousBnAndNat($event)">
                        Show previous BN/NAT
                    </button>
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
                <h5>Activity stats</h5>
                <bn-activity class="my-2" />
                <gmt-activity class="my-2" />
            </section>

            <section v-if="loggedInUser && loggedInUser.isNatLeader" class="card card-body">
                <h5>Vibe checks</h5>
                <vibe-check-stats />
            </section>

            <section v-if="loggedInUser && loggedInUser.isNatLeader" class="card card-body">
                <h5>Unique mapper stats</h5>
                <unique-mapper-stats />
            </section>

            <section v-if="loggedInUser && loggedInUser.isPishifat" class="card card-body">
                <h5>Temporary button</h5>
                <temporary-info />
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
import BnActivity from '../components/users/BnActivity.vue';
import GmtActivity from '../components/users/GmtActivity.vue';
import Badges from '../components/users/Badges.vue';
import FilterBox from '../components/FilterBox.vue';
import PaginationNav from '../components/PaginationNav.vue';
import VibeCheckStats from '../components/users/VibeCheckStats.vue';
import UniqueMapperStats from '../components/users/UniqueMapperStats.vue';
import TemporaryInfo from '../components/users/TemporaryInfo.vue';


export default {
    name: 'UsersPage',
    components: {
        ToastMessages,
        UserCard,
        UserInfo,
        BnActivity,
        GmtActivity,
        Badges,
        FilterBox,
        PaginationNav,
        VibeCheckStats,
        UniqueMapperStats,
        TemporaryInfo,
    },
    data () {
        return {
            userInput: '',
        };
    },
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

        const data = await this.$http.initialRequest('/users/relevantInfo');

        if (!data.error) {
            this.$store.commit('users/setUsers', data.users);

            const { id, osuId, username } = this.$route.query;
            let i = -1;

            if (id) {
                i = this.users.findIndex(u => u.id == id);

                if (i == -1) {
                    this.userInput = id.toString();
                    await this.loadUser();
                    i = this.users.findIndex(u => u.id == id);
                }
            } else if (osuId) {
                i = this.users.findIndex(u => u.osuId == osuId);

                if (i == -1) {
                    this.userInput = osuId.toString();
                    await this.loadUser();
                    i = this.users.findIndex(u => u.osuId == osuId);
                }
            } else if (username) {
                i = this.users.findIndex(u => u.username.toLowerCase() == username.toLowerCase());

                if (i == -1) {
                    this.userInput = username;
                    await this.loadUser();
                    i = this.users.findIndex(u => u.username.toLowerCase() == username.toLowerCase());
                }
            }

            if (i >= 0) {
                this.$store.commit('users/setSelectedUserId', this.users[i].id);
                $('#extendedInfo').modal('show');
            }
        }
    },
    methods: {
        updateSorting(sortBy) {
            this.$store.dispatch('users/updateSorting', sortBy);
        },
        async loadPreviousBnAndNat(e) {
            const res = await this.$http.executeGet('/users/loadPreviousBnAndNat', e);

            if (res) {
                this.$store.commit('users/setShowOldUsers', true);
                this.$store.commit('users/setUsers', res.users);
                this.$store.dispatch('users/pageFilters/setFilterMode', '');
            }
        },
        async loadBannedUsers(e) {
            const res = await this.$http.executeGet('/users/loadBannedUsers', e);

            if (res) {
                this.$store.commit('users/setShowOldUsers', true);
                this.$store.commit('users/setUsers', res.users);
                this.$store.dispatch('users/pageFilters/setFilterMode', '');
            }
        },
        async openUserModal(e) {
            if (this.userInput.length) {
                let i = this.users.findIndex(u =>
                    u.username.toLowerCase() == this.userInput.toLowerCase().trim() ||
                u.osuId.toString() == this.userInput.trim()
                );

                if (i >= 0) {
                    const id = this.users[i].id;
                    this.$store.commit('users/setSelectedUserId', id);

                    if (this.$route.query.id !== id) {
                        this.$router.replace(`/users?id=${id}`);
                    }

                    $('#extendedInfo').modal('show');
                } else {
                    const user = await this.loadUser(e);

                    if (user && !user.error) {
                        const id = user.id;
                        this.$store.commit('users/setSelectedUserId', id);

                        if (this.$route.query.id !== id) {
                            this.$router.replace(`/users?id=${id}`);
                        }

                        $('#extendedInfo').modal('show');
                    }
                }
            }
        },
        async loadUser(e) {
            const user = await this.$http.executeGet('/users/loadUser/' + this.userInput, e);

            if (user && !user.error) {
                const users = [...this.users];
                users.push(user);
                this.$store.commit('users/setUsers', users);
            }

            return user;
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
