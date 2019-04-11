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
    <section class="col-md-12 segment" v-if="queried">
        <p><a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{user.username}}</a>: {{findTotalTotalPoints()}}</p>
    </section>
    <section class="col-md-12 segment segment-image" v-if="queried">
        <table class="table table-sm table-dark table-hover col-md-12 mt-2">
            <thead>
                <td scope="col">Mapset</td>
                <td scope="col">Total points</td>
                <td scope="col">Date</td>
                <td scope="col">User</td>
            </thead>
                <tbody v-for="(eventGroup, i) in events" :key="i">
                    <tr class="sub-header vote-border-invis" @click="manualCollapse(eventGroup[0].beatmapsetId)">
                        <td scope="row"><a @click.stop :href="'https://osu.ppy.sh/beatmapsets/' + eventGroup[0].beatmapsetId" target="_blank">{{eventGroup[eventGroup.length-1].metadata}}</a> <i class="fas fa-angle-right vote-fail" :class="'arrow-' + eventGroup[0].beatmapsetId"></i></td>
                        <td scope="row">{{findTotalPoints(eventGroup)}}</td>
                        <td scope="row">{{new Date(eventGroup[eventGroup.length-1].timestamp).toString().slice(4,15)}}</td>
                        <td scope="row"></td>
                    </tr>
                    <tr v-for="event in eventGroup" :key="event.id" class="collapse" 
                    :class="['row-' + event.beatmapsetId, 
                    event.eventType == 'Bubbled' || event.eventType == 'Qualified' ? 'vote-border-neutral' : 
                    (event.eventType == 'Disqualified' || event.eventType == 'Popped') && event.valid == 1 ? 'vote-border-fail' : 
                    (event.eventType == 'Disqualified' || event.eventType == 'Popped') && event.valid != 1 ? 'vote-border-extend' : 
                    event.eventType == 'Ranked' ? 'vote-border-pass' : '']">
                        <td scope="row">
                            {{event.eventType == 'Bubbled' || event.eventType == 'Qualified' ? 'Nominated' : event.eventType}}{{event.eventType == 'Disqualified' || event.eventType == 'Popped' ? ": " + event.content.slice(0, event.content.indexOf('.')+1) || event.content : ''}}
                        </td>
                        <td scope="row">{{findPoints(event)}}</td>
                        <td scope="row">{{new Date(event.timestamp).toString().slice(4,15)}}</td>
                        <td scope="row"><a :href="'https://osu.ppy.sh/users/' + event.userId" target="_blank">{{event.userId == user.osuId ? user.username : "..."}}</a></td>
                    </tr>
                </tbody>
        </table>
        
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
            //if(!username || !username.length) username = 'neilperry'
            if(!username || !username.length){
                this.info = "Must enter a username!"
            }else{
                const result = await this.executePost('/bnScore/search/', { username: username }, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.queried = true;
                        this.events = result.events;
                        this.user = result.user;
                    }
                }
            }
        },
        manualCollapse: function(id) {
            $(`.row-${id}`).each( function () {
                $(this).toggleClass('collapse');
            });
            $(`.arrow-${id}`).toggleClass('fa-angle-right fa-angle-down')
        },
        findTotalTotalPoints: function(){
            let total = 0;
            for (let i = 0; i < this.events.length; i++) {
                total += this.findTotalPoints(this.events[i]);
            }
            return Math.round(total*10)/10;
        },
        findTotalPoints: function(events) {
            let total = 0;
            for (let i = 0; i < events.length; i++) {
                let event = events[i];
                total += this.findPoints(event);
            }
            return total;
        },
        findPoints: function(event) {
            if(event.eventType == 'Ranked'){
                let total = 10;
                total += Math.round(event.effortBonus*10)/10;
                if(!event.isUnique){
                    total *= 0.5;
                }
                if(event.isBnOrNat){
                    total *= 0.5;
                }
                return total;
            }else if(event.eventType == 'Disqualified' && event.valid == 1){
                return -5;
            }else{
                return 0;
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
            events: null,
            user: null,
        }
    },
    created() {
        $("#loading").hide(); //this is temporary
        $("#main").attr("style", "visibility: visible");
        //this.query();

    },
}
</script>