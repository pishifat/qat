<template>
    <div class="col-sm-12 col-md-6 col-lg-4 col-xl-3 my-3" @click="selectUser()">
        <div
            class="card card-individual"
            data-toggle="modal"
            data-target="#extendedInfo"
            :class="`card-bg-${user.probation.length && user.group != 'nat' ? 'probation' : user.group}`"
        >
            <img :src="'https://a.ppy.sh/' + user.osuId" class="card-avatar-img">
            <div class="card-body">
                <a
                    :href="'https://osu.ppy.sh/users/' + user.osuId"
                    class="wrap-text"
                    target="_blank"
                    @click.stop
                >
                    {{ user.username }}
                </a>

                <small
                    v-if="user.bnDuration.length"
                    class="ml-1"
                >
                    Joined BN: {{ user.bnDuration[0].slice(0, 10) }}
                </small>

                <small
                    v-if="user.natDuration.length"
                    class="ml-1"
                >
                    Joined NAT: {{ user.natDuration[0].slice(0, 10) }}
                </small>

                <div class="card-icons">
                    <i v-if="user.modes.indexOf('osu') >= 0" class="far fa-circle" />
                    <i v-if="user.modes.indexOf('taiko') >= 0" class="fas fa-drum" />
                    <i v-if="user.modes.indexOf('catch') >= 0" class="fas fa-apple-alt" />
                    <i v-if="user.modes.indexOf('mania') >= 0" class="fas fa-stream" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'UserCard',
    props: {
        user: {
            type: Object,
            required: true,
        },
    },
    methods: {
        selectUser() {
            this.$store.commit('setSelectedUserId', this.user.id);
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

</style>
