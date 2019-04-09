<template>
<div class="row">
    <div class="col-md-12">
        <section class="row segment segment-solid my-1 mx-4">
            <small>Search: 
                <input id="search" class="text-input" v-model="filterValue" type="text" placeholder="username... (3+ characters)" /> 
            </small>
            <small>
                <select class="custom-select ml-2" id="mode" v-model="filterMode">
                    <option value="" selected>All modes</option>
                    <option value="osu">osu!</option>
                    <option value="taiko">osu!taiko</option>
                    <option value="catch">osu!catch</option>
                    <option value="mania">osu!mania</option>
                </select>
            </small>
        </section>
        <section class="row segment segment-solid my-1 mx-4">
            <small>Sort by:
                <a :class="sortBy === 'username' ? 'sorted' : ''" href="#" @click.prevent="sort('username')">Name</a> | 
                <a :class="sortBy === 'bnDuration' ? 'sorted' : ''" href="#" @click.prevent="sort('bnDuration')">BN Tenure</a> | 
                <a :class="sortBy === 'natDuration' ? 'sorted' : ''" href="#" @click.prevent="sort('natDuration')">NAT Tenure</a>
            </small>
        </section>

        <section class="row segment segment-image mx-0 px-0">
            <div class="col-sm-12">
                <div class="row mx-auto">
                    <button :disabled="!(pre > 0)" class="btn btn-sm btn-nat mx-auto text-center my-2" type="button" @click="showNewer()">
                        <i class="fas fa-angle-up mr-1"></i> show next <i class="fas fa-angle-up ml-1"></i>
                    </button>
                </div>
                <transition-group name="list" tag="div" class="row mx-auto">
                    <user-card
                        v-for="user in pageObjs"
                        :key="user.id"
                        :user="user"
                        :userId="userId"
                        :isLeader="isLeader"
                        @update:selectedUser="selectedUser = $event"
                    ></user-card>
                </transition-group>
                <div class="row d-flex justify-content-center mt-2">
                    <p class="small">{{currentPage}} of {{pages}}</p>
                </div>
                <div class="row d-flex justify-content-center">
                    <button :disabled="!canShowOlder" class="btn btn-sm btn-nat text-center mb-2" type="button" @click="showOlder()">
                        <i class="fas fa-angle-down mr-1"></i> show previous <i class="fas fa-angle-down ml-1"></i>
                    </button>
                </div>
            </div>
        </section>

    </div>
    <user-info
        :user="selectedUser"
        :user-id="userId"
        :is-leader="isLeader"
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
    },
    data() {
        return {
            pageObjs: null,
            allObjs: null,
            filteredObjs: null,
            userId: null,
            isLeader: null,
            selectedUser: null,
        }
    },
    created() {
        axios
            .get('/users/relevantInfo')
            .then(response => {
                this.allObjs = response.data.users;
                this.userId = response.data.userId;
                this.isLeader = response.data.isLeader;
                this.limit = 24;
            }).then(function(){
                $("#loading").fadeOut();
                $('#main').attr("style", "visibility: visible").hide().fadeIn();
            });
    },
    mounted () {
        setInterval(() => {
            axios
                .get('/users/relevantInfo')
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
