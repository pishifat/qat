<template>
<div class="row">
    <div class="col-md-12">
        <filter-box 
            :filterMode.sync="filterMode" 
            :filterValue.sync="filterValue"
            :placeholder="'username... (3+ characters)'"
        >
        </filter-box>
        <section class="row segment segment-solid my-1 mx-4">
            <div class="small">
                <span class="filter-header">Sort by</span>
                <a :class="sortBy === 'username' ? 'sorted' : 'unsorted'" href="#" @click.prevent="sort('username')">Name</a>
                <a :class="sortBy === 'bnDuration' ? 'sorted' : 'unsorted'" href="#" @click.prevent="sort('bnDuration')">Time as BN</a>
                <a :class="sortBy === 'natDuration' ? 'sorted' : 'unsorted'" href="#" @click.prevent="sort('natDuration')">Time as NAT</a>
            </div>
        </section>

        <section class="row segment segment-image mx-0 px-0">
            <div class="col-sm-12">
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
                <button v-if="pre > 0" class="btn btn-sm btn-pags btn-pags-left" type="button" @click="showNewer()">
                    <i class="fas fa-angle-left px-1"></i>
                </button>
                <button v-if="canShowOlder" class="btn btn-sm btn-pags btn-pags-right" type="button" @click="showOlder()">
                    <i class="fas fa-angle-right px-1"></i>
                </button>
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
import FilterBox from '../components/FilterBox.vue';
import pagination from '../mixins/pagination.js';
import filters from '../mixins/filters.js';
import postData from '../mixins/postData.js';

export default {
    name: 'users-page',
    components: {
        UserCard,
        UserInfo,
        FilterBox,
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
