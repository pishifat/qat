<template>

<div class='col-md-4 col-lg-3 my-2' @click="selectUser()">
    <div class="card" :class="user.probation.length && user.group != 'qat' ? 'border-probation' : 'border-' + user.group"
        data-toggle="modal" data-target='#extendedInfo' :data-user="user.osuId">
                
        <div class='card-body user-card-spacing'>
            <a :href="'https://osu.ppy.sh/users/' + user.osuId"
                class="text-shadow" target="_blank" @click.stop>{{user.username}}</a> 
            <i v-if="user.modes.indexOf('osu') >= 0" class="far fa-circle text-shadow"></i>
            <i v-if="user.modes.indexOf('taiko') >= 0" class="fas fa-drum text-shadow"></i>
            <i v-if="user.modes.indexOf('catch') >= 0" class="fas fa-apple-alt text-shadow"></i>
            <i v-if="user.modes.indexOf('mania') >= 0" class="fas fa-stream text-shadow"></i>
            <span class="pseudo-float-right-avatar">
                <img :src="'https://a.ppy.sh/' + user.osuId" class="rounded-circle avatar-mini-thumb">
            </span>
            <p class="small ml-1 text-shadow" v-if="user.bnDuration.length">Joined BN: {{user.bnDuration[0].slice(0,10)}}</p>
            <p class="small ml-1 text-shadow" v-if="user.qatDuration.length">Joined QAT: {{user.qatDuration[0].slice(0,10)}}</p>
        </div>
    </div>
</div>

</template>

<script>
export default {
    name: 'user-card',
    props: ['user', 'user-id'],
    methods: {
        selectUser: function () {
            this.$emit('update:selectedUser', this.user)
        },
    }
}
</script>

<style>
    .avatar-mini-thumb{
        height:40px;
        width:40px;
        object-fit:cover;
        filter: drop-shadow(1px 1px 1px #000000);
    }

    .pseudo-float-right-avatar{
        position:absolute;
        top:0.5rem;
        right:0.75rem;
    }

    .user-card-spacing{
        margin: 0;
        padding: 0.5rem 0.5rem 0.5rem 0.5rem;
    }

</style>
