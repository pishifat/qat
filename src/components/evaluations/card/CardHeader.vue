<template>
    <div class="card-body mx-1">
        <div v-if="consensus" class="card-status" :class="consensusColor" />
        <p class="card-text text-shadow">
            <a :href="'https://osu.ppy.sh/users/' + osuId" target="_blank" @click.stop>
                {{ username }}
            </a>
        </p>
    </div>
</template>

<script>
export default {
    name: 'card-header',
    props: {
        username: String,
        osuId: Number,
        consensus: String,
    },
    computed: {
        consensusColor() {
            if(!this.consensus){
                return '';
            }else if(this.consensus == 'extend'){
                return 'card-status-neutral';
            }else{
                return 'card-status-' + this.consensus;
            }
        }
    },
};
</script>
