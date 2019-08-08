<template>
    <div class="col-sm-6 col-md-4 col-lg-4 col-xl-3 my-3" @click="selectUser()">
        <div
            class="card"
            data-toggle="modal"
            data-target="#extendedInfo"
            :data-user="user.osuId"
            :class="`card-bg-${user.probation.length && user.group != 'nat' ? 'probation' : user.group}`"
        >
            <img :src="'https://a.ppy.sh/' + user.osuId" class="card-avatar-img" />
            <div class="card-body">
                <a
                    :href="'https://osu.ppy.sh/users/' + user.osuId"
                    class="text-shadow wrap-text"
                    target="_blank"
                    @click.stop
                >
                    {{ user.username }}
                </a>
                <p class="small ml-1 text-shadow" v-if="user.bnDuration.length">
                    Joined BN: {{ user.bnDuration[0].slice(0, 10) }}
                </p>
                <p class="card-text small ml-1 text-shadow" v-if="user.natDuration.length">
                    Joined NAT: {{ user.natDuration[0].slice(0, 10) }}
                </p>
                <div class="card-icons">
                    <i v-if="user.modes.indexOf('osu') >= 0" class="far fa-circle text-shadow"></i>
                    <i v-if="user.modes.indexOf('taiko') >= 0" class="fas fa-drum text-shadow"></i>
                    <i v-if="user.modes.indexOf('catch') >= 0" class="fas fa-apple-alt text-shadow"></i>
                    <i v-if="user.modes.indexOf('mania') >= 0" class="fas fa-stream text-shadow"></i>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'user-card',
    props: ['user', 'user-id'],
    methods: {
        selectUser: function() {
            this.$emit('update:selectedUser', this.user);
        },
    },
};
</script>

<style>
.card-avatar-img {
    position: absolute;
    top: calc(50% - 40px);
    left: -12px;
    max-width: 60px;
    max-height: 60px;
    object-fit: cover;
    border-radius: 100%;
    box-shadow: 0 1px 1rem rgba(10, 10, 25);
}
.card-icons {
    border-top: 2px solid #4e514f;
    padding-top: 2px;
    margin-top: auto;
    text-align: center;
}
.card-body {
    padding: 0.5rem 1rem 0.5rem 3.5rem;
}
</style>
