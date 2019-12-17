<template>
    <!--nat options-->
    <div v-if="isNat && currentMediators.indexOf(userId) === -1 && veto.vetoer.id !== userId" class="text-shadow">
        <hr>
        <div v-if="veto.mediations.length">
            <ul style="list-style-type: none; padding-left: 0.5rem">
                <li v-for="mediation in veto.mediations" :key="mediation.id">
                    <a
                        v-if="!mediation.comment && veto.status === 'wip'"
                        href="#"
                        data-toggle="tooltip"
                        data-placement="top"
                        title="replace mediator"
                        @click.prevent="replaceMediator(mediation.id);"
                    >
                        <i class="fas fa-redo-alt vote-pass" />
                    </a>
                    {{ mediation.mediator.username }}:
                    <pre v-if="!mediation.comment" class="pre-font small">...</pre>
                    <pre
                        v-else
                        class="pre-font small"
                        :class="getVoteClass(mediation.vote)"
                        v-html="filterLinks(mediation.comment.trim())"
                    />
                </li>
            </ul>
            <span v-if="veto.status !== 'upheld' && veto.status !== 'withdrawn'">
                <button class="btn btn-sm" :class="majority ? 'btn-nat' : 'btn-nat-red'" @click="concludeMediation($event)">{{ majority ? 'Uphold Veto' : 'Withdraw Veto' }}</button>
                <button class="btn btn-sm btn-nat" @click="concludeMediation($event, true)">Dismiss Without Mediation</button>
            </span>
            <span v-else>
                <button class="btn btn-sm btn-nat" @click="continueMediation($event, true)">Re-initiate Veto Mediation</button>
            </span>
            <button class="btn btn-sm btn-nat float-right" data-toggle="collapse" data-target="#conclusion">
                See full conclusion post <i class="fas fa-angle-down" />
            </button>
            <button class="btn btn-sm btn-nat float-right mr-1" data-toggle="collapse" data-target="#forumMessage">
                See full forum PM <i class="fas fa-angle-down" />
            </button>
            <conclusion-post
                :veto="veto"
                :majority="majority"
            />
            <forum-pm :veto="veto" />
        </div>
        <div v-else-if="veto.status !== 'upheld' && veto.status !== 'withdrawn'">
            <button class="btn btn-sm btn-nat mb-2" @click="selectMediators($event)">
                {{ mediators ? 'Re-select Mediators' : 'Select Mediators' }}
            </button>
            <button class="btn btn-sm btn-nat mb-2" @click="concludeMediation($event, true)">
                Dismiss Without Mediation
            </button>
            <div class="mb-2">
                <span class="text-shadow">Exclude specific user(s):</span>
                <input id="excludeUsers" class="ml-1 w-75 small" type="text" placeholder="username1, username2, username3..."><br>
                <small class="ml-2 text-shadow">The mapper and veto submitter are automatically excluded</small>
            </div>
            <div v-if="mediators" class="mt-2">
                <p>Users:</p>
                <div id="usernames" class="copy-paste mb-4" style="width: 25%">
                    <ul style="list-style-type: none; padding: 0">
                        <li v-for="user in mediators" :key="user.id">
                            <samp class="small">{{ user.username }}</samp>
                        </li>
                    </ul>
                </div>
                <p>
                    <button v-if="mediators" class="btn btn-sm btn-nat-red mb-2" @click="beginMediation($event)">
                        Begin Mediation
                    </button>
                    <button class="btn btn-sm btn-nat float-right" data-toggle="collapse" data-target="#forumMessage">
                        See full forum PM <i class="fas fa-angle-down" />
                    </button>
                </p>
                <forum-pm :veto="veto" />
            </div>
        </div>
        <div v-else>
            <p class="text-shadow min-spacing">
                This veto's mediation was dismissed due to being invalid, inappropriate, or resolved by the mapper.
            </p>
        </div>
        <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">
            {{ info }} {{ confirm }}
        </div>
    </div>
</template>

<script>
import ConclusionPost from './ConclusionPost.vue';
import filterLinks from '../../../mixins/filterLinks';
import ForumPm from './ForumPm.vue';
import postData from '../../../mixins/postData';

export default {
    name: 'mediations',
    components: {
        ConclusionPost,
        ForumPm
    },
    props: {
        currentMediators: Array,
        isNat: Boolean,
        majority: Boolean,
        userId: String,
        veto: {
            mediations: Array,
            status: String,
            vetoer: {
                id: String
            }
        }
    },
    mixins: [ filterLinks, postData ],
    data() {
        return {
            confirm: '',
            info: '',
            mediators: null
        }
    },
    methods: {
        async beginMediation (e) {
            const result = confirm(`Are you sure?`);

            if (result) {
                const r = await this.executePost(`/vetoes/beginMediation/${this.veto.id}`, { mediators: this.mediators }, e);

                if (r) {
                    if (r.error) {
                        this.info = r.error;
                    } else {
                        this.$emit('update-veto', r);
                    }
                }
            }
        },

        async concludeMediation (e, dismiss) {
            this.info = '';
            this.confirm = '';
            const result = confirm(`Are you sure?`);

            if (result) {
                const v = await this.executePost(
                    `/vetoes/concludeMediation/${this.veto.id}`,
                    {
                        majority: this.majority,
                        dismiss
                    },
                    e
                );

                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        this.$emit('update-veto', v);
                        this.confirm = 'Mediation concluded!';
                    }
                }
            }
        },

        async continueMediation (e) {
            this.info = '';
            this.confirm = '';
            const result = confirm(`Are you sure? This should only be done if a mistake was made.`);

            if (result) {
                const v = await this.executePost(`/vetoes/continueMediation/${this.veto.id}`, {}, e);

                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        this.$emit('update-veto', v);
                        this.confirm = 'Mediation re-opened!';
                    }
                }
            }
        },

        getVoteClass (vote) {
            switch(vote) {
                case 1:
                    return 'vote-pass';
                case 2:
                    return 'vote-neutral';
                case 3:
                    return 'vote-fail';
            }
        },

        async replaceMediator (mediationId) {
            const result = confirm(`Are you sure? This should only be done if a mistake was made.`);

            if (result) {
                const v = await this.executePost(`/vetoes/replaceMediator/${this.veto.id}`, { mediationId });

                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        this.$emit('update-veto', v);
                    }
                }
            }
        },

        async selectMediators (e) {
            let excludeUsers = $('#excludeUsers').val().split(',');

            for (let i = 0; i < excludeUsers.length; i++) {
                excludeUsers[i] = excludeUsers[i].trim().toLowerCase();
            }

            excludeUsers.push(this.veto.beatmapMapper.toLowerCase(), this.veto.vetoer.username.toLowerCase());

            const r = await this.executePost('/vetoes/selectMediators', { mode: this.veto.mode, excludeUsers }, e);

            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.mediators = r;
                }
            }
        }
    }
};
</script>
