<template>

<div class="row">
    <section class="col-md-12 segment mb-4">
        <div class="input-group input-group-sm">
            <input type="text" placeholder="username..." id="search" 
                @keyup.enter="query($event)" maxlength="18" autocomplete="off"/>
            <button class="btn btn-nat ml-2" @click="query($event)" type="submit">Search archives</button>
            <span v-if="info" class="errors ml-4 mt-2">Error: {{info}}</span>
        </div>
        <div class="input-group input-group-sm my-2">
            <input type="text" placeholder="# entries..." id="limit"
                @keyup.enter="queryRecent($event)" maxlength="3" autocomplete="off"/>
            <button class="btn btn-nat ml-2" @click="queryRecent($event)" type="submit">Show recent</button>
        </div>
    </section>
    <section class="col-md-12 segment segment-image" v-if="queried">
        <h2>Application Evaluations</h2>
        
        <div v-if="appEvals.length">
            <transition-group name="list" tag="div" class="row">
                <discuss-card
                    v-for="discussApp in appEvals"
                    :discuss-app="discussApp"
                    :evaluator="evaluator"
                    :readOnly="true"
                    :user-to-evaluate="discussApp.applicant"
                    :mode="discussApp.mode"
                    :key="discussApp.id"
                    @update:selectedDiscussApp="selectedDiscussApp = $event"
                    @update:selectedDiscussRound="selectedDiscussRound = $event"
                ></discuss-card>
            </transition-group>
        </div>
        <p v-else class="ml-4">None...</p>
    </section>
    <section class="col-md-12 segment segment-image" v-if="queried">
        <h2>BN Evaluations</h2>
        
        <div v-if="bnEvals.length">
            <transition-group name="list" tag="div" class="row">
                <discuss-card
                    v-for="discussRound in bnEvals"
                    :discuss-round="discussRound"
                    :evaluator="evaluator"
                    :readOnly="true"
                    :user-to-evaluate="discussRound.bn"
                    :mode="discussRound.mode"
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
                const result = await this.executePost('/evalArchive/search/', { username: username }, e);
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
        },
        queryRecent: async function(e) {
            this.info = '';
            let limit = $('#limit').val();
            if(parseInt(limit)){
                const result = await this.executePost('/evalArchive/searchRecent/', {limit: limit}, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.appEvals = result.a;
                        this.bnEvals = result.b; 
                    }
                }
            }else{
                this.info = "Invalid number"
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
            .get('/evalArchive/relevantInfo')
            .then(response => {
                this.evaluator = response.data.evaluator;
            }).then(function(){
                $("#loading").fadeOut();
                $("#main").attr("style", "visibility: visible").hide().fadeIn();
            });
    },
}
</script>