<template>
<div id="extendedInfo" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="user">
            <div
                class="modal-header text-dark"
                :class="user.probation.length && user.group != 'nat' ? 'bg-probation' : 'bg-' + user.group"
            >
                <h5 class="modal-title">
                    {{ user.username }}
                    <i v-if="user.modes.indexOf('osu') >= 0" class="far fa-circle"></i>
                    <i v-if="user.modes.indexOf('taiko') >= 0" class="fas fa-drum"></i>
                    <i v-if="user.modes.indexOf('catch') >= 0" class="fas fa-apple-alt"></i>
                    <i v-if="user.modes.indexOf('mania') >= 0" class="fas fa-stream"></i>
                </h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <p class="text-shadow mb-2">Time as BN: {{ calculateDuration('bn') }}</p>
                <div class="text-shadow">
                    <ul style="list-style-type: none">
                        <li class="small" v-for="(date, i) in user.bnDuration" :key="date">
                            {{ i % 2 == 0 ? 'Joined' : 'Left' }}: {{ date.slice(0, 10) }}
                        </li>
                    </ul>
                </div>
                <p class="text-shadow mb-2">Time as NAT: {{ calculateDuration('nat') }}</p>
                <div class="text-shadow">
                    <ul style="list-style-type: none">
                        <li class="small" v-for="(date, i) in user.natDuration" :key="date">
                            {{ i % 2 == 0 ? 'Joined' : 'Left' }}: {{ date.slice(0, 10) }}
                        </li>
                    </ul>
                </div>
                <p class="text-shadow">
                    Veto Mediation: {{ user.vetoMediator ? 'Active' : 'Inactive' }}
                    <button
                        v-if="isLeader"
                        class="btn btn-sm ml-2"
                        :class="{ 'btn-nat-green': !user.vetoMediator, 'btn-nat-red': user.vetoMediator }"
                        @click="switchMediator($event)"
                    >
                        {{ user.vetoMediator ? 'Mark as inactive' : 'Mark as active' }}
                    </button>
                </p>
                <p v-if="user.group != 'nat' && user.id == userId" class="text-shadow">
                    BN Evaluation:
                    <button
                        class="btn btn-sm"
                        :class="{ 'btn-nat-green': !user.isBnEvaluator, 'btn-nat-red': user.isBnEvaluator }"
                        @click="switchBnEvaluator($event)"
                    >
                        {{ user.isBnEvaluator ? 'Opt-out' : 'Opt-in' }}
                    </button>
                </p>
                <hr />
                <span v-if="isLeader">
                    <button
                        class="btn btn-nat-red btn-sm"
                        @click="user.group == 'bn' ? switchGroup('nat', $event) : switchGroup('bn', $event)"
                    >
                        {{ user.group == 'bn' ? 'Move to NAT' : 'Move to BN' }}
                    </button>
                    <button
                        class="btn btn-nat-red btn-sm"
                        @click="removeGroup();"
                    >
                        Remove from {{user.group.toUpperCase()}}
                    </button>
                </span>
                <p class="text-shadow float-right">Joined: {{ user.createdAt.slice(0, 10) }}</p>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'user-info',
    props: ['user', 'user-id', 'is-leader'],
    mixins: [postData],
    methods: {
        //display
        calculateDuration: function(group) {
            let dateArray = group == 'bn' ? this.user.bnDuration : this.user.natDuration;
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
            let remainingDays = Math.round(days % 365);
            if (years > 0) {
                return `${years} ${years == 1 ? 'year' : 'years'}, ${remainingDays} days`;
            } else {
                return `${remainingDays} days`;
            }
        },
        //real
        switchMediator: async function(e) {
            const u = await this.executePost(
                '/users/switchMediator/',
                { userId: this.user.id, vetoMediator: this.user.vetoMediator },
                e
            );
            if (u) {
                if (u.error) {
                    this.info = u.error;
                } else {
                    this.$emit('update-user', u);
                }
            }
        },
        switchBnEvaluator: async function(e) {
            const u = await this.executePost('/users/switchBnEvaluator/', {}, e);
            if (u) {
                if (u.error) {
                    this.info = u.error;
                } else {
                    this.$emit('update-user', u);
                }
            }
        },
        switchGroup: async function(group, e) {
            const result = confirm(
                `Are you sure? This will affect join/leave dates and potentially reveal hidden pages.`
            );
            if (result) {
                const u = await this.executePost('/users/switchGroup/' + this.user.id, { group: group }, e);
                if (u) {
                    if (u.error) {
                        this.info = u.error;
                    } else {
                        this.$emit('update-user', u);
                    }
                }
            }
        },
        removeGroup: async function(e) {
            const result = confirm(
                `Are you sure?`
            );
            if (result) {
                const u = await this.executePost('/users/removeGroup/' + this.user.id, {}, e);
                if (u) {
                    if (u.error) {
                        this.info = u.error;
                    } else {
                        this.$emit('update-user', u);
                        $('#extendedInfo').modal('hide');
                    }
                }
            }
        },
    },
};
</script>