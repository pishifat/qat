<template>
    <div>
        <announcements />
        <section class="card card-body">
            <h4 class="mx-auto mb-3">
                Current Beatmap Nominators
            </h4>
            <transition-group
                appear
                name="route-transition"
                mode="out-in"
                tag="div"
                class="row align-items-start"
            >
                <table v-for="usersByMode in sorted" :key="usersByMode._id" class="table table-sm table-dark table-hover col-6 col-md-3">
                    <thead>
                        <td v-if="usersByMode._id != 'none'">{{ usersByMode._id == 'osu' ? 'osu!' : 'osu!' + usersByMode._id }}</td>
                        <td v-else>Structural NAT (see <a href="https://osu.ppy.sh/wiki/People/Nomination_Assessment_Team#structural">wiki</a>)</td>
                    </thead>
                    <tbody>
                        <tr v-for="user in usersByMode.users" :key="user.id"> 
                            <user-card :user="user" />
                        </tr>
                    </tbody>
                </table>
            </transition-group>
        </section>

        <a
            id="mgsite"
            class="btn btn-sm btn-primary"
            href="https://mappersguild.com/"
            style="
                position: fixed;
                z-index: 1060;
                bottom: 20px;
                right: 20px;"
        >
            visit Mappers' Guild
        </a>

        <user-info />
        
        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import evaluations from '../mixins/evaluations';
import usersHomeModule from '../store/usersHome';
import ToastMessages from '../components/ToastMessages.vue';
import Announcements from '../components/home/Announcements.vue';
import UserLink from '../components/UserLink.vue';
import UserCard from '../components/home/UserCard.vue';
import UserInfo from '../components/home/UserInfo.vue';

export default {
    name: 'Index',
    components: {
        ToastMessages,
        Announcements,
        UserLink,
        UserCard,
        UserInfo,
    },
    mixins: [ evaluations ],
    computed: {
        ...mapState([
            'allUsersByMode',
            'loggedInUser',
        ]),
        ...mapState('usersHome', [
            'users',
        ]),
        sorted () {
            const sortOrder = ['osu', 'taiko', 'catch', 'mania', 'none'];
            const sorted = [...this.allUsersByMode];

            return sorted.sort(function(a, b) {
                return sortOrder.indexOf(a._id) - sortOrder.indexOf(b._id);
            });
        },
    },
    beforeCreate () {
        if (!this.$store.hasModule('usersHome')) {
            this.$store.registerModule('usersHome', usersHomeModule);
        }
    },
    async created () {
        if (this.allUsersByMode.length) return;

        const data = await this.$http.executeGet('/relevantInfo');

        if (!data.error) {
            // set home users
            this.$store.commit('setHomeData', data.allUsersByMode);

            // set actual users for modal state purposes
            const users = data.allUsersByMode.reduce((acc, curr) => {
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
        }
    },
};
</script>
