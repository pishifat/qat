<template>

<div id="extendedInfo" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="user">
            <div class="modal-header text-dark" :class="user.probation.length && user.group != 'nat' ? 'bg-probation' : 'bg-' + user.group">
                <h5 class="modal-title">{{user.username}}
                    <i v-if="user.modes.indexOf('osu') >= 0" class="far fa-circle"></i>
                    <i v-if="user.modes.indexOf('taiko') >= 0" class="fas fa-drum"></i>
                    <i v-if="user.modes.indexOf('catch') >= 0" class="fas fa-apple-alt"></i>
                    <i v-if="user.modes.indexOf('mania') >= 0" class="fas fa-stream"></i>
                </h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: hidden">
                <p class="text-shadow">BN Score: coming soon</p>
                <p class="text-shadow">Time as BN: {{calculateDuration('bn')}}</p>
                <p class="text-shadow">Time as NAT: {{calculateDuration('nat')}}</p>
                <p v-if="user.id == userId" class="text-shadow">Veto Mediation: 
                    <button 
                        class="btn btn-sm justify-content-center" 
                        :class="{ 'btn-nat': user.vetoMediator, 'btn-nat-red': !user.vetoMediator }" 
                        @click="switchMediator($event)"
                    >
                        {{user.vetoMediator ? 'Opt-in' : 'Opt-out'}}
                    </button>
                </p>
                <hr>
                <button 
                    class="btn btn-nat btn-sm justify-content-center"
                    @click="user.group == 'bn' ? switchGroup('nat', $event) : switchGroup('bn', $event)">
                    {{user.group == 'bn' ? 'Move to NAT' : 'Move to BN'}}
                </button>
                <p class="text-shadow float-right">Joined: {{user.createdAt.slice(0,10)}}</p>
            </div>
        </div>
    </div>
</div>

</template>

<script>
import postData from "../../mixins/postData.js";

export default {
    name: 'user-info',
    props: [ 'user', 'user-id' ],
    mixins: [ postData ],
    methods: {
        //display
        calculateDuration: function(group) {
            let dateArray = group == 'bn' ? this.user.bnDuration : this.user.natDuration;
            let days = 0;
            for (let i = 0; i < dateArray.length; i+=2) {
                let a = new Date(dateArray[i]);
                let b = new Date(dateArray[i+1]);
                if(dateArray[i+1]){
                    days += (Math.abs(b.getTime() - a.getTime())) / (1000 * 3600 * 24);
                }else{
                    days += (Math.abs(new Date().getTime() - a.getTime())) / (1000 * 3600 * 24);
                }
            }
            let years = Math.floor(days/365);
            let remainingDays = Math.round(days % 365);
            if(years > 0){
                return `${years} ${years == 1 ? 'year' : 'years'}, ${remainingDays} days`
            }else{
                return `${remainingDays} days`
            }
        },
        //real
        switchMediator: async function(e){
            const u = await this.executePost('/nat/users/switchMediator/', {}, e);
            if(u){
                if (u.error) {
                    this.info = u.error
                } else {
                    this.$emit('update-user', u);
                }
            }
        },
        switchGroup: async function(group, e){
            const u = await this.executePost('/nat/users/switchGroup/' + this.user.id, {group: group}, e);
            if(u){
                if (u.error) {
                    this.info = u.error
                } else {
                    this.$emit('update-user', u);
                }
            }
        },
    },
}
</script>