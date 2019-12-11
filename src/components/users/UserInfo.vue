<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="user" class="modal-content">
                <div
                    class="modal-header text-dark"
                    :class="user.probation.length && user.group != 'nat' ? 'bg-probation' : 'bg-' + user.group"
                >
                    <h5 class="modal-title">
                        <a class="text-dark" :href="'https://osu.ppy.sh/users/' + user.osuId">{{ user.username }}</a>
                        <i v-if="user.modes.indexOf('osu') >= 0" class="far fa-circle" />
                        <i v-if="user.modes.indexOf('taiko') >= 0" class="fas fa-drum" />
                        <i v-if="user.modes.indexOf('catch') >= 0" class="fas fa-apple-alt" />
                        <i v-if="user.modes.indexOf('mania') >= 0" class="fas fa-stream" />
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p v-if="user.bnDuration.length" class="text-shadow mb-2">
                        Time as BN: {{ calculateDuration('bn') }}
                    </p>
                    <div v-if="user.bnDuration.length" class="text-shadow">
                        <ul style="list-style-type: none">
                            <li v-for="(date, i) in user.bnDuration" :key="date" class="small">
                                {{ i % 2 == 0 ? 'Joined' : 'Left' }}: {{ date.slice(0, 10) }}
                            </li>
                        </ul>
                    </div>
                    <p v-if="user.natDuration.length" class="text-shadow mb-2">
                        Time as NAT: {{ calculateDuration('nat') }}
                    </p>
                    <div v-if="user.natDuration.length" class="text-shadow">
                        <ul style="list-style-type: none">
                            <li v-for="(date, i) in user.natDuration" :key="date" class="small">
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
                            {{ user.vetoMediator ? 'Deactivate' : 'Activate' }}
                        </button>
                    </p>
                    <div v-if="isNat">
                        <hr>
                        <div class="form-group">
                            <textarea
                                v-model="comment"
                                placeholder="new user note..."
                                class="form-control dark-textarea"
                                style="white-space: pre-line;"
                                rows="2"
                            />
                        </div>
                        <div class="mb-4">
                            <button class="btn btn-sm btn-nat float-right" @click="saveNote($event)">
                                Save
                            </button>
                        </div>
                        <ul v-if="notes" class="mt-2">
                            <li v-if="!notes.length" class="small min-spacing">User has no notes</li>
                            <li v-else v-for="note in notes" :key="note.id" class="small text-shadow">
                                <b>{{ note.createdAt.slice(0,10) }} - {{ note.author.username }}</b>
                                <a href="#" @click.prevent="hideNote(note.id);" class="vote-fail" data-toggle="tooltip" data-placement="top" title="delete note">&times;</a>
                                <pre class="secondary-text pre-font ml-2" v-html="filterLinks(note.comment)"></pre>
                            </li>
                        </ul>
                        <p v-if="info.length" class="errors text-shadow mt-2">
                            {{ info }}
                        </p>
                        <p v-if="confirm.length" class="confirm text-shadow mt-2">
                            {{ confirm }}
                        </p>
                    </div>
                    <p v-if="user.group != 'nat' && user.id == userId" class="text-shadow">
                        BN Evaluation: {{ user.isBnEvaluator ? 'Active' : 'Inactive' }}
                        <button
                            class="btn btn-sm ml-2"
                            :class="{ 'btn-nat-green': !user.isBnEvaluator, 'btn-nat-red': user.isBnEvaluator }"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Toggle ability to give input on BN applications"
                            @click="switchBnEvaluator($event)"
                        >
                            {{ user.isBnEvaluator ? 'Deactivate' : 'Activate' }}
                        </button>
                    </p>
                    <hr>
                    <span v-if="isLeader">
                        <button
                            class="btn btn-nat-red btn-sm minw-150"
                            @click="user.group == 'bn' ? switchGroup('nat', $event) : switchGroup('bn', $event)"
                        >
                            {{ user.group == 'bn' ? 'Move to NAT' : 'Move to BN' }}
                        </button>
                        <button
                            v-if="user.group == 'nat'"
                            class="btn btn-nat-red btn-sm minw-200"
                            @click="removeNat();"
                        >
                            Remove from NAT
                        </button>
                    </span>
                    <p class="text-shadow float-right">
                        Joined: {{ user.bnDuration.length ? user.bnDuration[0].slice(0, 10) : user.natDuration[0].slice(0, 10) }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';

export default {
    name: 'UserInfo',
    mixins: [postData, filterLinks],
    props: ['user', 'userId', 'isLeader', 'isNat'],
    data() {
        return {
            notes: null,
            comment: '',
            info: '',
            confirm: '',
        };
    },
    watch: {
        user() {
            this.notes = null;
            this.comment = '';
            this.info = '';
            this.confirm = '';
            this.loadUserNotes();
        },
    },
    methods: {
        //display
        calculateDuration(group) {
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
        async switchMediator(e) {
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
        async switchBnEvaluator(e) {
            const u = await this.executePost('/users/switchBnEvaluator/', {}, e);
            if (u) {
                if (u.error) {
                    this.info = u.error;
                } else {
                    this.$emit('update-user', u);
                }
            }
        },
        async switchGroup(group, e) {
            const result = confirm(
                `Are you sure? This will affect join/leave dates and potentially reveal hidden pages.`
            );
            if (result) {
                const u = await this.executePost('/users/switchGroup/' + this.user.id, { group }, e);
                if (u) {
                    if (u.error) {
                        this.info = u.error;
                    } else {
                        this.$emit('update-user', u);
                    }
                }
            }
        },
        async removeNat(e) {
            const result = confirm(
                `Are you sure?`
            );
            if (result) {
                const u = await this.executePost('/users/removeNat/' + this.user.id, {}, e);
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
        async loadUserNotes() {
            axios
                .get('/users/loadUserNotes/' + this.user.id)
                .then(response => {
                    this.notes = response.data;
                });
        },
        async saveNote(e) {
            if(this.comment.length){
                const n = await this.executePost('/users/saveNote/' + this.user.id, { comment: this.comment }, e);
                if (n) {
                    if (n.error) {
                        this.info = n.error;
                    } else {
                        if(this.notes){
                            this.notes.unshift(n)
                        }
                        this.confirm = 'Note added!'
                    }
                }
            }
        },
        async hideNote(noteId) {
            const n = await this.executePost('/users/hideNote/' + noteId, { userId: this.user.id });
            if(this.notes){
                const i = this.notes.findIndex(note => note.id == noteId);
                this.notes.splice(i, 1);
            }
            this.confirm = 'Note removed!' 
        },
    },
};
</script>