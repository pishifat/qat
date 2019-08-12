<template>
    <div class="row">
        <section class="col-md-12 segment mb-4">
            <div class="input-group input-group-sm">
                <input
                    id="search"
                    type="text"
                    placeholder="username..." 
                    maxlength="18"
                    autocomplete="off"
                    @keyup.enter="query($event)" 
                >
                <button class="btn btn-nat ml-2" type="submit" @click="query($event)">
                    Search archives
                </button>
                <span v-if="info" class="errors ml-4 mt-2">Error: {{ info }}</span>
            </div>
            <div class="input-group input-group-sm my-2">
                <input
                    id="limit"
                    type="text"
                    placeholder="# entries..."
                    maxlength="3"
                    autocomplete="off"
                    @keyup.enter="queryRecent($event)" 
                >
                <button class="btn btn-nat ml-2" type="submit" @click="queryRecent($event)">
                    Show recent
                </button>
            </div>
        </section>
        <section v-if="queried" class="col-md-12 segment segment-image">
            <h2>Application Evaluations</h2>
        
            <div v-if="appEvals.length">
                <transition-group name="list" tag="div" class="row">
                    <discuss-card
                        v-for="discussApp in appEvals"
                        :key="discussApp.id"
                        :discuss-app="discussApp"
                        :evaluator="evaluator"
                        :read-only="true"
                        :user-to-evaluate="discussApp.applicant"
                        :mode="discussApp.mode"
                        @update:selectedDiscussApp="selectedDiscussApp = $event"
                        @update:selectedDiscussRound="selectedDiscussRound = $event"
                    />
                </transition-group>
            </div>
            <p v-else class="ml-4">
                None...
            </p>
        </section>
        <section v-if="queried" class="col-md-12 segment segment-image">
            <h2>BN Evaluations</h2>
        
            <div v-if="bnEvals.length">
                <transition-group name="list" tag="div" class="row">
                    <discuss-card
                        v-for="discussRound in bnEvals"
                        :key="discussRound.id"
                        :discuss-round="discussRound"
                        :evaluator="evaluator"
                        :read-only="true"
                        :user-to-evaluate="discussRound.bn"
                        :mode="discussRound.mode"
                        @update:selectedDiscussApp="selectedDiscussApp = $event"
                        @update:selectedDiscussRound="selectedDiscussRound = $event"
                    />
                </transition-group>
            </div>
            <p v-else class="ml-4">
                None...
            </p>
        </section>

        <discuss-info
            :discuss-app="selectedDiscussApp"
            :discuss-round="selectedDiscussRound"
            :evaluator="evaluator"
            :read-only="true"
            @update-eval-round="updateEvalRound($event)"
        />
    </div>
</template>



<script>
import DiscussCard from '../components/evaluations/DiscussCard.vue';
import DiscussInfo from '../components/evaluations/DiscussInfo.vue';
import postData from '../mixins/postData.js';

export default {
    name: 'EvalArchivePage',
    components: {
        DiscussCard,
        DiscussInfo,
    },
    mixins: [postData],
    data() {
        return {
            appEvals: null,
            selectedDiscussApp: null,
            bnEvals: null,
            selectedDiscussRound: null,
            queried: false,
            info: '',
            evaluator: null,
        };
    },
    created() {
        axios
            .get('/evalArchive/relevantInfo')
            .then(response => {
                this.evaluator = response.data.evaluator;
            }).then(function(){
                $('#loading').fadeOut();
                $('#main').attr('style', 'visibility: visible').hide().fadeIn();
            });
    },
    methods: {
        query: async function(e) {
            this.info = '';
            let username = $('#search').val();
            if(!username || !username.length){
                this.info = 'Must enter a username!';
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
                const result = await this.executePost('/evalArchive/searchRecent/', { limit: limit }, e);
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
                this.info = 'Invalid number';
            }
        },
    },
};
</script>