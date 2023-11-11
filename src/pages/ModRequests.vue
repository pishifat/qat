<template>
    <div class="row">
        <div class="col-sm">
            <section class="card card-body">
                <h4 class="mx-auto mb-3">
                    Open Beatmap Nominators
                </h4>
                <p class="mx-auto mb-3 text-center">This is a list of Beatmap Nominators who are currently open for requests. Make sure to pay attention to their request methods and guidelines listed in their userpages!</p>
                <transition-group
                    appear
                    name="route-transition"
                    mode="out-in"
                    tag="div"
                    class="row align-items-start"
                >
                    <table v-for="usersByMode in openUsers" :key="usersByMode._id" class="table table-sm table-dark table-hover col-6 col-md-3">
                        <span v-if="usersByMode.users.length">
                            <thead>
                                <td v-if="usersByMode._id != 'none'">{{ usersByMode._id == 'osu' ? 'osu!' : 'osu!' + usersByMode._id }}</td>
                                <td v-else>Structural NAT (see <a href="https://osu.ppy.sh/wiki/People/Nomination_Assessment_Team#structural">wiki</a>)</td>
                            </thead>
                            <tbody>
                                <tr v-for="user in usersByMode.users" :key="user.id"> 
                                    <user-card :user="user" />
                                </tr>
                            </tbody>
                        </span>
                    </table>
                </transition-group>
            </section>
        </div>

        <user-info />
        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import modRequestsModule from '../store/modRequests';
import usersHomeModule from '../store/usersHome';
import ToastMessages from '../components/ToastMessages.vue';
import UserCard from '../components/home/UserCard.vue';
import UserInfo from '../components/home/UserInfo.vue';

export default {
    name: 'ModRequests',
    components: {
        ToastMessages,
        UserCard,
        UserInfo,
    },
    data () {
        return {
            link: '',
            category: '',
            comment: '',
            openUsers: [],
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('usersHome', [
            'users',
        ]),
        ...mapState('modRequests', [
            'ownRequests',
        ]),
    },
    beforeCreate () {
        if (!this.$store.hasModule('modRequests')) {
            this.$store.registerModule('modRequests', modRequestsModule);
        }
        if (!this.$store.hasModule('usersHome')) {
            this.$store.registerModule('usersHome', usersHomeModule);
        }
    },
    async created () {
        const userData = await this.$http.initialRequest('/relevantInfo');

        if (userData.allUsersByMode) {
            // set actual users for modal state purposes
            const users = userData.allUsersByMode.reduce((acc, curr) => {
                return [...acc, ...curr.users];
            }, []);

            this.$store.commit('usersHome/setUsers', users);

            // set selected user if query param is present
            const id = this.$route.query.id;

            if (id) {
                let i = this.users.findIndex(u => u.id == id);

                if (i >= 0) {
                    this.$store.commit('usersHome/setSelectedUserId', id);
                    $('#userInfo').modal('show');
                }
            }

            this.openUsers = this.filterOpenUsers(userData.allUsersByMode);
        }
    },
    methods: {
        filterOpenUsers(allUsersByMode) {
            const sortOrder = ['osu', 'taiko', 'catch', 'mania', 'none'];
            const filtered = allUsersByMode;

            // filter out users who have "closed" in their requestStatus array
            filtered.forEach((mode) => {
                mode.users = mode.users.filter((user) => {
                    return (!user.requestStatus?.includes('closed') && user.requestStatus?.length);
                });
            });

            return filtered.sort(function(a, b) {
                return sortOrder.indexOf(a._id) - sortOrder.indexOf(b._id);
            });
        },
    },
};
</script>
