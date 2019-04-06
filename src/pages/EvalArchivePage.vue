<template>

<div class="row">
    <section class="row segment segment-solid mb-4">
        <div class="input-group input-group-sm">
            <input class="form-control form-control-sm" type="text" placeholder="username" id="search" 
                style="filter: drop-shadow(1px 1px 1px #000000); border-radius: 100px 0 0 100px" 
                @keyup.enter="query($event)" maxlength="18"/>
            <div class="input-group-append">
                <button style="border-radius: 0 100px 100px 0;" class="btn btn-nat" @click="query($event)" type="submit">Search archives</button>
            </div>
        </div>
        <p v-if="info" class="errors mt-1">{{info}}</p> 
    </section>
    <section class="col-md-12 segment" v-if="queried">
        <h2>Application Evaluations</h2>
        
        <div v-if="appEvals.length">
            <transition-group name="list" tag="div" class="row">
                <discuss-card
                    v-for="discussApp in appEvals"
                    :discuss-app="discussApp"
                    :evaluator="evaluator"
                    :readOnly="true"
                    :key="discussApp.id"
                    @update:selectedDiscussApp="selectedDiscussApp = $event"
                    @update:selectedDiscussRound="selectedDiscussRound = $event"
                ></discuss-card>
            </transition-group>
        </div>
        <p v-else class="ml-4">None...</p>
    </section>
    <section class="col-md-12 segment" v-if="queried">
        <h2>BN Evaluations</h2>
        
        <div v-if="bnEvals.length">
            <transition-group name="list" tag="div" class="row">
                <discuss-card
                    v-for="discussRound in bnEvals"
                    :discuss-round="discussRound"
                    :evaluator="evaluator"
                    :readOnly="true"
                    :key="discussRound.id"
                    @update:selectedDiscussApp="selectedDiscussApp = $event"
                    @update:selectedDiscussRound="selectedDiscussRound = $event"
                ></discuss-card>
            </transition-group>
        </div>
        <p v-else class="ml-4">None...</p>
    </section>

    <discuss-info
        :discussApp="selectedDiscussApp"
        :discussRound="selectedDiscussRound"
        :evaluator="evaluator"
        :readOnly="true"
        @update-eval-round="updateEvalRound($event)"
    ></discuss-info>

</div>

</template>



<script>
import DiscussCard from '../components/evaluations/DiscussCard.vue';
import DiscussInfo from '../components/evaluations/DiscussInfo.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'eval-archive-page',
    components: {
        DiscussCard,
        DiscussInfo
    },
    mixins: [postData],
    methods: {
        query: async function(e) {
            this.info = '';
            let username = $('#search').val();
            if(!username || !username.length){
                this.info = "Must enter a username!"
            }else{
                const result = await this.executePost('/nat/evalArchive/search/', { username: username }, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.appEvals = result.a;
                        this.bnEvals = result.b; 
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
            evaluator: null
        }
    },
    created() {
        axios
            .get('/nat/evalArchive/relevantInfo')
            .then(response => {
                this.evaluator = response.data.evaluator;
            }).then(function(){
                $("#loading").fadeOut();
                $("#main").attr("style", "visibility: visible").hide().fadeIn();
            });
    },
}
</script>