<template>
    <div>
        <mod-score-calculator />

        <section class="card card-body">
            <h4 class="mx-auto mb-3">
                Current Beatmap Nominators
            </h4>

            <transition-group
                appear
                name="route-transition"
                mode="out-in"
                tag="div"
                class="row"
            >
                <table v-for="usersByMode in allUsersByMode" :key="usersByMode._id" class="table table-sm table-dark table-hover col-6 col-md-3">
                    <thead>
                        <td>{{ usersByMode._id }}</td>
                    </thead>

                    <tbody>
                        <tr v-for="user in usersByMode.users" :key="user.id">
                            <td
                                :style="getGroupColor(user)"
                            >
                                <user-link
                                    :osu-id="user.osuId"
                                    :username="user.username"
                                />
                            </td>
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
import postData from '../mixins/postData';
import ToastMessages from '../components/ToastMessages.vue';
import ModScoreCalculator from '../components/home/ModScoreCalculator.vue';
import UserLink from '../components/UserLink.vue';

export default {
    name: 'Index',
    components: {
        ToastMessages,
        ModScoreCalculator,
        UserLink,
    },
    mixins: [ postData ],
    computed: mapState([
        'allUsersByMode',
    ]),
    async created () {
        if (this.allUsersByMode.length) return;

        const data = await this.executeGet('/relevantInfo');

        if (data.allUsersByMode) {
            this.$store.commit('setHomeData', data.allUsersByMode);
        }
    },
    methods: {
        getGroupColor (user) {
            if (user.group === 'nat') {
                return 'border-left: 3px solid var(--danger);';
            }

            if (user.level === 'probation') {
                return 'border-left: 3px solid var(--probation);';
            }

            if (user.level === 'full') {
                return 'border-left: 3px solid var(--bn);';
            }
        },
    },
};
</script>
