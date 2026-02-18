<template>
    <div class="row">
        <div class="col-sm">
            <section class="card card-body">
                <h4 class="mx-auto mb-3">
                    Open Beatmap Nominators
                </h4>
                <p class="mx-auto mb-3 text-center">
                    This is a list of Beatmap Nominators who are currently open for requests. Make sure to pay attention to their request methods and guidelines listed in their userpages!
                </p>
                <a
                    data-bs-toggle="collapse"
                    href="#filters"
                >
                    <h5>Filter by preferences <i class="fas fa-angle-down" /></h5>
                </a>
                <div id="filters" class="row collapse">
                    <preference-filter
                        :title="'Genres'"
                        :values="genres"
                    />
                    <preference-filter
                        :title="'Languages'"
                        :values="languages"
                    />
                    <preference-filter
                        :title="'Details'"
                        :values="details"
                    />
                    <preference-filter
                        :title="'Mappers'"
                        :values="mappers"
                    />
                    <preference-filter
                        :title="'osu! styles'"
                        :values="osuStyles"
                    />
                    <preference-filter
                        :title="'osu!taiko styles'"
                        :values="taikoStyles"
                    />
                    <preference-filter
                        :title="'osu!catch styles'"
                        :values="catchStyles"
                    />
                    <preference-filter
                        :title="'osu!mania styles'"
                        :values="maniaStyles"
                    />
                    <preference-filter
                        :title="'osu!mania keymodes'"
                        :values="maniaKeymodes"
                    />
                </div>
                <transition-group
                    appear
                    name="route-transition"
                    mode="out-in"
                    tag="div"
                    class="row align-items-start mt-2"
                >
                    <table v-for="usersByMode in filteredUsers" :key="usersByMode._id" class="table table-sm table-dark table-hover col-6 col-md-3">
                        <span v-if="usersByMode.users.length">
                            <thead>
                                <td v-if="usersByMode._id != 'none'">{{ formatMode(usersByMode._id) }}</td>
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
import { mapState, mapGetters } from 'vuex';
import modRequestsModule from '../store/modRequests';
import usersHomeModule from '../store/usersHome';
import ToastMessages from '../components/ToastMessages.vue';
import UserCard from '../components/home/UserCard.vue';
import UserInfo from '../components/home/UserInfo.vue';
import PreferenceFilter from '../components/modRequests/PreferenceFilter.vue';
import enums from 'shared/enums';
const { GenrePreferences, LanguagePreferences, DetailPreferences, MapperPreferences, OsuStylePreferences, TaikoStylePreferences, CatchStylePreferences, ManiaStylePreferences, ManiaKeymodePreferences } = enums;

export default {
    name: 'ModRequests',
    components: {
        ToastMessages,
        UserCard,
        UserInfo,
        PreferenceFilter,
    },
    data () {
        return {
            genres: GenrePreferences,
            languages: LanguagePreferences,
            details: DetailPreferences,
            mappers: MapperPreferences,
            osuStyles: OsuStylePreferences,
            taikoStyles: TaikoStylePreferences,
            catchStyles: CatchStylePreferences,
            maniaStyles: ManiaStylePreferences,
            maniaKeymodes: ManiaKeymodePreferences,
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
            'included',
        ]),
        ...mapGetters('modRequests', [
            'filteredUsers',
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

            this.$store.commit('modRequests/setUsers', userData.allUsersByMode);
        }
    },
};
</script>

<style scoped>
.fake-checkbox:hover {
    cursor: pointer;
    color: lightblue;
    opacity: 0.7;
}
</style>