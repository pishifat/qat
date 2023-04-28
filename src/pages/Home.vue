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
                        <td>{{ usersByMode._id == 'osu' ? 'osu!' : 'osu!' + usersByMode._id }}</td>
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

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import evaluations from '../mixins/evaluations';
import ToastMessages from '../components/ToastMessages.vue';
import Announcements from '../components/home/Announcements.vue';
import UserLink from '../components/UserLink.vue';
import UserCard from '../components/home/UserCard.vue';

export default {
    name: 'Index',
    components: {
        ToastMessages,
        Announcements,
        UserLink,
        UserCard,
    },
    mixins: [ evaluations ],
    computed: {
        ...mapState([
            'allUsersByMode',
            'loggedInUser',
        ]),
        sorted () {
            const sortOrder = ['osu', 'taiko', 'catch', 'mania'];
            const sorted = [...this.allUsersByMode];

            return sorted.sort(function(a, b) {
                return sortOrder.indexOf(a._id) - sortOrder.indexOf(b._id);
            });
        },
    },
    async created () {
        if (this.allUsersByMode.length) return;

        const data = await this.$http.executeGet('/relevantInfo');

        if (data.allUsersByMode) {
            this.$store.commit('setHomeData', data.allUsersByMode);
        }
    },
};
</script>
