<template>
<div class="row">
    <div class="col-md-12">
        <div class="row mb-3">
            <div class="col-lg-12 col-md-12">
                <small>temp
                    <input id="username" placeholder="username"/>
                    <input id="osuId" placeholder="osu id"/>
                    <input id="mode" placeholder="mode (just 1)"/> 
                    <input id="group" placeholder="bn/nat"/> 
                    <input id="probation" placeholder="probation mode"/> | 
                    <input id="date" placeholder="date" @keyup.enter="tempUpdate()"/>
                    <button @click="tempCreate()">temp create</button>
                    <button @click="tempUpdate()">temp update</button>
                </small>
                <hr>
                <small>Search: 
                    <input id="search" class="text-input" v-model="filterValue" type="text" placeholder="username... (3+ characters)" /> 
                </small>
                <small>
                <select class="custom-select inline-custom-select ml-2" id="mode" v-model="filterMode">
                    <option value="" selected>All modes</option>
                    <option value="osu">osu!</option>
                    <option value="taiko">osu!taiko</option>
                    <option value="catch">osu!catch</option>
                    <option value="mania">osu!mania</option>
                </select>
                </small>
            </div>
            <div class="col-lg-4 col-md-4">
                <small>Sort: 
                    <a :class="sortBy === 'username' ? 'sorted' : ''" href="#" @click.prevent="sort('username')">Name</a> | 
                    <a :class="sortBy === 'bnDuration' ? 'sorted' : ''" href="#" @click.prevent="sort('bnDuration')">BN Tenure</a> | 
                    <a :class="sortBy === 'natDuration' ? 'sorted' : ''" href="#" @click.prevent="sort('natDuration')">NAT Tenure</a>
                </small>
            </div>
        </div>

        <button :disabled="!(pre > 0)" class="btn btn-sm btn-nat mx-auto my-2" style="display:block" type="button" @click="showNewer()">
            <i class="fas fa-angle-up mr-1"></i> show next <i class="fas fa-angle-up ml-1"></i>
        </button>
        <transition-group name="list" tag="div" class="row">
            <user-card
                v-for="user in pageObjs"
                :key="user.id"
                :user="user"
                :userId="userId"
                :userGroup="userGroup"
                @update:selectedUser="selectedUser = $event"
            ></user-card>
        </transition-group>
        <div class="small text-center mx-auto">{{currentPage}} of {{pages}}</div>
        <button :disabled="!canShowOlder" class="btn btn-sm btn-nat mx-auto my-2" style="display:block" type="button" @click="showOlder()">
            <i class="fas fa-angle-down mr-1"></i> show previous <i class="fas fa-angle-down ml-1"></i>
        </button>
    </div>
    <user-info
        :user="selectedUser"
        :user-id="userId"
        :user-group="userGroup"
        @update-user="updateUser($event)"
    ></user-info>

</div>
</template>

<script>
import UserCard from '../components/users/UserCard.vue';
import UserInfo from '../components/users/UserInfo.vue';
import pagination from '../mixins/pagination.js';
import filters from '../mixins/filters.js';
import postData from '../mixins/postData.js';

export default {
    name: 'users-page',
    components: {
        UserCard,
        UserInfo, 
    },
    mixins: [postData, pagination, filters],
    methods: {
        filterBySearchValueContext: function(u) {
            if(u.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        updateUser: function(u) {
			const i = this.pageObjs.findIndex(user => user.id == u.id);
			this.pageObjs[i] = u;
            this.selectedUser = u;
        },
        sortDuration: function(dateArray, user) {
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
            return days;
        },
        tempCreate: async function(e){
            const username = $('#username').val();
            const osuId = $('#osuId').val();
            const mode = $('#mode').val();
            const group = $('#group').val();
            const probation = $('#probation').val();
            const u = await this.executePost('/nat/users/tempCreate/', {username: username, osuId: osuId, mode: mode, group: group, probation: probation}, e);
            if(u){
                console.log("ye");
            }
        },
        tempUpdate: async function(e){
            const username = $('#username').val();
            const mode = $('#mode').val();
            const group = $('#group').val();
            const probation = $('#probation').val();
            const date = new Date($('#date').val());
            const u = await this.executePost('/nat/users/tempUpdate/', {username: username, group: group, mode: mode, probation: probation, date: date}, e);
            if(u){
                console.log("yeeeee");
            }
        },
    },
    data() {
        return {
            pageObjs: null,
            allObjs: null,
            filteredObjs: null,
            userId: null,
            userGroup: null,
            selectedUser: null,
        }
    },
    created() {
        axios
            .get('/nat/users/relevantInfo')
            .then(response => {
                this.allObjs = response.data.users;
                this.userId = response.data.userId;
                this.userGroup = response.data.userGroup;
                this.limit = 16;
            }).then(function(){
                $("#loading").fadeOut();
                $("#main").attr("style", "visibility: visible").hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/nat/users/relevantInfo')
                .then(response => {
                    this.allObjs = response.data.users;
                    if(this.isFiltered){
                        this.filter();
                    }
                });
        }, 300000);
    }
}
</script>

<style>

</style>
