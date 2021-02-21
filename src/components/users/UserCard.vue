<template>
    <div class="col-sm-12 col-md-6 col-lg-4 col-xl-3 my-3" @click="selectUser()">
        <div
            class="card card-individual"
            data-toggle="modal"
            data-target="#extendedInfo"
            :class="`card-bg-${user.probationModes.length && !user.isNat ? 'probation' : user.groups.includes('bn') ? 'bn' : user.groups.includes('nat') ? 'nat' : 'user'}`"
        >
            <img :src="'https://a.ppy.sh/' + user.osuId" class="card-avatar-img">
            <div class="card-body">
                <user-link
                    class="wrap-text"
                    :osu-id="user.osuId"
                    :username="user.username"
                    @click.stop
                />
                <small
                    v-if="bnHistory.length"
                    class="ml-1"
                >
                    BN for {{ calculateDuration('bn') }}
                </small>

                <small
                    v-if="natHistory.length"
                    class="ml-1"
                >
                    NAT for {{ calculateDuration('nat') }}

                </small>

                <mode-display
                    class="card-icons"
                    :modes="user.modes"
                />
            </div>
        </div>
    </div>
</template>

<script>
import duration from '../../mixins/duration.js';
import ModeDisplay from '../ModeDisplay.vue';
import UserLink from '../UserLink.vue';

export default {
    name: 'UserCard',
    components: {
        ModeDisplay,
        UserLink,
    },
    mixins: [ duration ],
    props: {
        user: {
            type: Object,
            required: true,
        },
    },
    computed: {
        selectedUser () {
            return this.user;
        },
    },
    methods: {
        selectUser() {
            this.$store.commit('users/setSelectedUserId', this.user.id);

            if (this.$route.query.id !== this.user.id) {
                this.$router.replace(`/users?id=${this.user.id}`);
            }
        },
    },
};
</script>

<style scoped>

.card-avatar-img {
    position: absolute;
    top: calc(50% - 40px);
    left: -12px;
    max-width: 60px;
    max-height: 60px;
    object-fit: cover;
    border-radius: 100%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25, .9);
    background-color: var(--gray-dark);
}

.card-icons {
    border-top: 2px solid #4e514f;
    padding-top: 2px;
    margin-top: auto;
    text-align: center;
}

.card-body {
    padding: 0.5rem 1rem 0.5rem 4.25rem;
}

.card-bg-nat {
    background-image: url('/images/nat.png');
    background-repeat: no-repeat;
    background-position: left;
}
.card-bg-bn {
    background-image: url('/images/bn.png');
    background-repeat: no-repeat;
    background-position: left;
}
.card-bg-probation {
    background-image: url('/images/probation.png');
    background-repeat: no-repeat;
    background-position: left;
}
.card-bg-user {
    background-image: url('/images/user.png');
    background-repeat: no-repeat;
    background-position: left;
}

</style>
