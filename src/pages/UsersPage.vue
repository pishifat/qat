<template>
    <div class="row">
        <div class="col-md-12">
            <filter-box 
                :filter-mode.sync="filterMode" 
                :filter-value.sync="filterValue"
                :placeholder="'username... (3+ characters)'"
            />
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
                            :user-id="userId"
                            :is-leader="isLeader"
                            @update:selectedUser="selectedUser = $event"
                        />
                    </transition-group>
                    <button v-if="pre > 0" class="btn btn-sm btn-pags btn-pags-left" type="button" @click="showNewer()">
                        <i class="fas fa-angle-left px-1" />
                    </button>
                    <button v-if="canShowOlder" class="btn btn-sm btn-pags btn-pags-right" type="button" @click="showOlder()">
                        <i class="fas fa-angle-right px-1" />
                    </button>
                </div>
            </section>
            <!-- admin tools -->
            <section v-if="isNat" class="segment segment-solid my-1 mx-4">
                <div class="my-2">
                    <button
                        class="btn btn-sm btn-nat minw-200 my-1"
                        data-toggle="tooltip"
                        data-placement="right"
                        title="Finds NAT eval activity, defaults to 30 days"
                        @click="findNatActivity()"
                    >
                        Load NAT activity
                    </button>
                    <input
                        v-model="natDays"
                        class="small"
                        type="text"
                        autocomplete="off"
                        placeholder="days of activity..."
                        maxlength="3"
                        @keyup.enter="findNatActivity()"
                    >
                    <small class="ml-1">
                        <select v-model="natMode" class="custom-select">
                            <option class="ml-2" value="osu" selected>osu!</option>
                            <option class="ml-2" value="taiko">osu!taiko</option>
                            <option class="ml-2" value="catch">osu!catch</option>
                            <option class="ml-2" value="mania">osu!mania</option>
                        </select>
                    </small>
                    <div v-if="natActivity">
                        <div v-for="user in natActivity" :key="user.username" class="small min-spacing mb-1">
                            <a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{ user.username }}</a>
                            <p 
                                class="min-spacing" 
                                :style="user.totalEvaluations > natTotal/2 ? 
                                    'background-color: rgb(50,255,50,0.25);' 
                                    : user.totalEvaluations > natTotal/3 ? 
                                        'background-color: rgb(255,255,0,0.25);' :
                                        'background-color: rgb(255,50,50,0.25);'"
                            >
                                Total evaluations: {{ user.totalEvaluations }}
                            </p>
                            <p
                                class="min-spacing"
                                :style="user.totalWrittenFeedbacks > natTotal/6 ? 
                                    'background-color: rgb(50,255,50,0.25);' : 
                                    user.totalWrittenFeedbacks > natTotal/9 ? 
                                        'background-color: rgb(255,255,0,0.25);' : 
                                        'background-color: rgb(255,50,50,0.25);'"
                            >
                                Total written feedback: {{ user.totalWrittenFeedbacks }}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="my-2">
                    <button
                        class="btn btn-sm btn-nat minw-200 my-1"
                        data-toggle="tooltip"
                        data-placement="right"
                        title="Finds BN nomination, pop/dq, and report activity, defaults to 30 days"
                        @click="findBnActivity()"
                    >
                        Load BN activity
                    </button>
                    <input
                        v-model="bnDays"
                        class="small"
                        type="text"
                        autocomplete="off"
                        placeholder="days of activity..."
                        maxlength="3"
                        @keyup.enter="findBnActivity()"
                    >
                    <small class="ml-1">
                        <select v-model="bnMode" class="custom-select">
                            <option class="ml-2" value="osu" selected>osu!</option>
                            <option class="ml-2" value="taiko">osu!taiko</option>
                            <option class="ml-2" value="catch">osu!catch</option>
                            <option class="ml-2" value="mania">osu!mania</option>
                        </select>
                    </small>
                    <div v-if="bnActivity">
                        <div v-for="user in bnActivity" :key="user.username" class="small min-spacing mb-1">
                            <a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{ user.username }}</a>
                            <p class="min-spacing" :style="user.uniqueNominations < bnDays/10 ? 'background-color: rgb(255,50,50,0.25);' : user.uniqueNominations < bnDays/6 ? 'background-color: rgb(255,255,0,0.25);' : 'background-color: rgb(50,255,50,0.25);'">
                                Nominations: {{ user.uniqueNominations }}
                            </p>
                            <p class="min-spacing">
                                Nomination resets: {{ user.nominationResets }}
                            </p>
                            <p class="min-spacing">
                                Beatmap Reports: {{ user.beatmapReports }}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="my-2">
                    <button
                        class="btn btn-sm btn-nat minw-200 my-1"
                        data-toggle="tooltip"
                        data-placement="right"
                        title="Finds relevant yearly profile badge info"
                        @click="findUserBadgeInfo()"
                    >
                        Load badge info
                    </button>
                    <div v-if="badgeUsers.length">
                        <p class="min-spacing small my-2">
                            only pishifat can edit this section
                        </p>
                        <div v-for="user in badgeUsers" :key="user.id" class="small min-spacing mb-1">
                            <a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{ user.username }}</a>
                            <p class="min-spacing" :style="user.bnProfileBadge != calculateDuration(user.bnDuration) && calculateDuration(user.bnDuration) >= 2 ? 'background-color: rgb(255,50,50,0.25);' : ''">
                                BN: {{ calculateDuration(user.bnDuration) }} -- badge: {{ user.bnProfileBadge }}
                                <a href="#" @click.prevent="editBadgeValue(user.id, 'bn', true)"><i class="fas fa-plus" /></a>
                                <a href="#" @click.prevent="editBadgeValue(user.id, 'bn', false)"><i class="fas fa-minus" /></a>
                            </p>
                            <p class="min-spacing" :style="user.natProfileBadge != calculateDuration(user.natDuration) && calculateDuration(user.natDuration) >= 3 ? 'background-color: rgb(255,50,50,0.25);' : ''">
                                NAT: {{ calculateDuration(user.natDuration) }} -- badge: {{ user.natProfileBadge }}
                                <a href="#" @click.prevent="editBadgeValue(user.id, 'nat', true)"><i class="fas fa-plus" /></a>
                                <a href="#" @click.prevent="editBadgeValue(user.id, 'nat', false)"><i class="fas fa-minus" /></a>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="my-2">
                    <button
                        class="btn btn-sm btn-nat minw-200 my-1"
                        data-toggle="tooltip"
                        data-placement="right"
                        title="Finds info on prospective NAT members"
                        @click="findPotentialNatInfo()"
                    >
                        Load potential NAT info
                    </button>
                    <div v-if="potentialNatInfo.length">
                        <div v-for="user in potentialNatInfo" :key="user.osuId" class="small min-spacing my-2">
                            <a :href="'https://osu.ppy.sh/users/' + user.osuId" target="_blank">{{ user.username }}</a>
                            <p class="ml-2 min-spacing">
                                <a data-toggle="collapse" :href="'#evaluations' + user.osuId" @click.prevent>Show app evals ({{ user.evaluatedApps.length }}) <i class="fas fa-angle-down" /></a>
                            </p>
                            <div :id="'evaluations' + user.osuId" class="collapse ml-4">
                                <div v-for="app in user.evaluatedApps" :key="app.id">
                                    <p class="min-spacing">
                                        Applicant: <a :href="'https://osu.ppy.sh/users/' + app.applicant.osuId" target="_blank">{{ app.applicant.username }}</a>
                                    </p>
                                    <p class="min-spacing">
                                        Consensus: <span :class="app.consensus == 'pass' ? 'vote-pass' : 'vote-fail'">{{ app.consensus }}</span>
                                    </p>
                                    <p class="min-spacing mb-1">
                                        NAT Feedback: <i>{{ app.feedback }}</i>
                                    </p>
                                    <p class="min-spacing">
                                        BN's opinion:<span :class="findVote(app.evaluations, user.osuId) == 'pass' ? 'vote-pass' : findVote(app.evaluations, user.osuId) == 'neutral' ? 'vote-neutral' : 'vote-fail'">
                                            {{ findVote(app.evaluations, user.osuId) }}
                                        </span>
                                    </p>
                                    <p class="ml-3 min-spacing">
                                        Behavior comment: <i>{{ findBehaviorComment(app.evaluations, user.osuId) }}</i> 
                                    </p>
                                    <p class="ml-3 min-spacing">
                                        Modding comment: <i>{{ findModdingComment(app.evaluations, user.osuId) }}</i> 
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <user-info
            :user="selectedUser"
            :user-id="userId"
            :is-leader="isLeader"
            @update-user="updateUser($event)"
        />
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
    name: 'UsersPage',
    components: {
        UserCard,
        UserInfo,
        FilterBox,
    },
    mixins: [postData, pagination, filters],
    data() {
        return {
            pageObjs: null,
            allObjs: null,
            filteredObjs: null,
            userId: null,
            isLeader: null,
            isNat: null,
            selectedUser: null,
            badgeUsers: [],
            natActivity: null,
            natDays: '',
            natMode: 'osu',
            natTotal: null,
            bnActivity: null,
            bnDays: '',
            bnMode: 'osu',
            potentialNatInfo: [],
        };
    },
    created() {
        axios
            .get('/users/relevantInfo')
            .then(response => {
                this.allObjs = response.data.users;
                this.userId = response.data.userId;
                this.isLeader = response.data.isLeader;
                this.isNat = response.data.isNat;
                this.limit = 24;
            }).then(function(){
                $('#loading').fadeOut();
                $('#main').attr('style', 'visibility: visible').hide().fadeIn();
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
    },
    methods: {
        filterBySearchValueContext(u) {
            if(u.username.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        updateUser(u) {
            const i = this.pageObjs.findIndex(user => user.id == u.id);
            this.pageObjs[i] = u;
            this.selectedUser = u;
        },
        sortDuration(dateArray) {
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
        findUserBadgeInfo() {
            axios
                .get('/users/findUserBadgeInfo')
                .then(response => {
                    this.badgeUsers = [];
                    let users = response.data;
                    users.forEach(user => {
                        if((this.calculateDuration(user.bnDuration) >= 2) || (this.calculateDuration(user.natDuration) >= 2)){
                            this.badgeUsers.push(user);
                        }
                    });
                });
        },
        calculateDuration(dateArray) {
            let days = 0;
            for (let i = 0; i < dateArray.length; i += 2) {
                let a = new Date(dateArray[i]);
                let b = new Date(dateArray[i + 1]);
                if (dateArray[i + 1]) {
                    days += Math.abs(b.getTime() - a.getTime()) / (1000 * 3600 * 24);
                } else {
                    days += Math.abs(new Date().getTime() - a.getTime()) / (1000 * 3600 * 24);
                }
            }
            let years = Math.floor(days / 365);
            return years;
        },
        async editBadgeValue(id, group, add) {
            const u = await this.executePost(
                '/users/editBadgeValue/' + id,
                { group, add }
            );
            if (u && !u.error) {
                const i = this.badgeUsers.findIndex(user => user.id == u.id);
                group == 'bn' ? this.badgeUsers[i].bnProfileBadge = u.bnProfileBadge : this.badgeUsers[i].natProfileBadge = u.natProfileBadge;
            }
        },
        findNatActivity() {
            if(!this.natDays.length) this.natDays = 30;
            axios
                .get('/users/findNatActivity/' + this.natDays + '/' + this.natMode)
                .then(response => {
                    this.natActivity = response.data.info;
                    this.natTotal = response.data.total;
                });
        },
        findBnActivity() {
            if(!this.bnDays.length) this.bnDays = 30;
            axios
                .get('/users/findBnActivity/' + this.bnDays + '/' + this.bnMode)
                .then(response => {
                    this.bnActivity = response.data;
                });
        },
        findPotentialNatInfo() {
            axios
                .get('/users/findPotentialNatInfo/')
                .then(response => {
                    let users = response.data;
                    users.forEach(user => {
                        if(user.evaluatedApps.length){
                            this.potentialNatInfo.push(user);
                        }
                    });
                });
        },
        findVote(evaluations, osuId) {
            let vote = 'none';
            evaluations.forEach(evaluation => {
                if(evaluation.evaluator.osuId == osuId){
                    if(evaluation.vote == 1) vote = 'pass';
                    else if(evaluation.vote == 2) vote = 'neutral';
                    else if(evaluation.vote == 3) vote = 'fail';
                }
            });
            return vote;
        },
        findBehaviorComment(evaluations, osuId) {
            let behaviorComment = 'none';
            evaluations.forEach(evaluation => {
                if(evaluation.evaluator.osuId == osuId){
                    behaviorComment = evaluation.behaviorComment;
                }
            });
            return behaviorComment;
        },
        findModdingComment(evaluations, osuId) {
            let moddingComment = 'none';
            evaluations.forEach(evaluation => {
                if(evaluation.evaluator.osuId == osuId){
                    moddingComment = evaluation.moddingComment;
                }
            });
            return moddingComment;
        },
    },
};
</script>

<style>

</style>
