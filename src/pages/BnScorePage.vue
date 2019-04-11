<template>

<div class="row">
    <section class="row segment mb-4">
        <div class="input-group input-group-sm">
            <input class="form-control form-control-sm" type="text" placeholder="username" id="search" 
                style="filter: drop-shadow(1px 1px 1px #000000); border-radius: 100px 0 0 100px" 
                @keyup.enter="query($event)" maxlength="18"/>
            <div class="input-group-append">
                <button style="border-radius: 0 100px 100px 0;" class="btn btn-nat" @click="query($event)" type="submit">Search</button>
            </div>
        </div>
        <p v-if="info" class="errors mt-1">{{info}}</p> 
    </section>
    <section class="col-md-12 segment segment-image" v-if="queried">
        <div v-for="(eventGroup, i) in events" :key="i">
            <p>{{eventGroup[0].metadata}}</p>
        </div>
    </section>
</div>

</template>



<script>
import postData from '../mixins/postData.js';

export default {
    name: 'bn-score-page',
    components: {

    },
    mixins: [postData],
    methods: {
        query: async function(e) {
            this.info = '';
            let username = $('#search').val();
            if(!username || !username.length){
                this.info = "Must enter a username!"
            }else{
                const result = await this.executePost('/bnScore/search/', { username: username }, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.events = result;
                    }
                }
            }
        }
    },
    data() {
        return {
            appEvals: null,
            selectedDiscussApp: null,
            bnEvals: null,
            selectedDiscussRound: null,
            queried: false,
            info: '',
            events: null
        }
    },
    created() {
        $("#loading").hide(); //this is temporary
        $("#main").attr("style", "visibility: visible");
    },
}
</script>