<template>
    <div>
        <div v-if="veto.mediations.length">
            <span v-if="veto.status !== 'upheld' && veto.status !== 'withdrawn'">
                <button class="btn btn-sm btn-block btn-nat-red mb-2" @click="concludeMediation($event)">
                    {{ majority ? 'Uphold Veto' : 'Withdraw Veto' }}
                </button>
                <button class="btn btn-sm btn-block btn-nat-red mb-2" @click="concludeMediation($event, true)">
                    Dismiss without mediation
                </button>
            </span>
            <span v-else>
                <button class="btn btn-sm btn-nat-red btn-block mb-2" @click="continueMediation($event, true)">
                    Re-initiate veto mediation
                </button>
            </span>
            <button class="btn btn-sm btn-block btn-nat mb-2" data-toggle="collapse" data-target="#conclusion">
                See full conclusion post <i class="fas fa-angle-down" />
            </button>
            <conclusion-post
                :discussion-link="veto.discussionLink"
                :mediations="veto.mediations"
                :majority="majority"
            />
            <button class="btn btn-sm btn-block btn-nat mb-2" data-toggle="collapse" data-target="#forumMessage">
                See full forum PM <i class="fas fa-angle-down" />
            </button>
            <forum-pm
                :beatmap-id="parseInt(veto.beatmapId, 10)"
                :beatmap-title="veto.beatmapTitle"
                :discussion-link="veto.discussionLink"
                :short-reason="veto.shortReason"
            />
        </div>
        <div v-else-if="veto.status !== 'upheld' && veto.status !== 'withdrawn'">
            <hr>
            <div class="mb-2">
                <span class="text-shadow">Exclude specific user(s):</span>
                <input
                    id="excludeUsers"
                    class="ml-1 w-75 small"
                    type="text"
                    placeholder="username1, username2, username3..."
                ><br>
                <div class="small text-shadow px-4">
                    The mapper and veto submitter are automatically excluded. Please manually exclude any guest difficulty creators and the nominating BNs.
                </div>
            </div>
            <button class="btn btn-sm btn-block btn-nat mb-2" @click="selectMediators($event)">
                {{ mediators ? 'Re-select Mediators' : 'Select Mediators' }}
            </button>
            <button v-if="mediators" class="btn btn-sm btn-block btn-nat-red mb-2" @click="beginMediation($event)">
                Begin Mediation
            </button>
            <div v-if="mediators" class="mt-2">
                <p class="text-shadow">
                    Users:
                </p>
                <div id="usernames" class="copy-paste mb-4" style="width: 25%">
                    <ul style="list-style-type: none; padding: 0">
                        <li v-for="user in mediators" :key="user.id">
                            <samp class="small">{{ user.username }}</samp>
                        </li>
                    </ul>
                </div>
                <button class="btn btn-sm btn-block btn-nat mb-2" data-toggle="collapse" data-target="#forumMessage">
                    See full forum PM <i class="fas fa-angle-down" />
                </button>
                <forum-pm
                    :beatmap-id="parseInt(veto.beatmapId, 10)"
                    :beatmap-title="veto.beatmapTitle"
                    :discussion-link="veto.discussionLink"
                    :short-reason="veto.shortReason"
                />
            </div>
            <button class="btn btn-sm btn-block btn-nat-red mb-2" @click="concludeMediation($event, true)">
                Dismiss Without Mediation
            </button>
        </div>
        <div class="errors text-shadow ml-2">
            {{ info }}
        </div>
    </div>
</template>

<script>
import ConclusionPost from './ConclusionPost.vue';
import filterLinks from '../../../mixins/filterLinks';
import ForumPm from './ForumPm.vue';
import postData from '../../../mixins/postData';

export default {
    name: 'AdminButtons',
    components: {
        ConclusionPost,
        ForumPm,
    },
    mixins: [ filterLinks, postData ],
    props: {
        currentMediators: {
            type: Array,
            default() {
                return [];
            },
        },
        veto: {
            type: Object,
            required: true,
            mediations: Array,
            status: String,
            vetoer: {
                id: String,
            },
        },
    },
    data() {
        return {
            confirm: '',
            info: '',
            mediators: null,
        };
    },
    computed: {
        majority () {
            let total = 0;

            this.veto.mediations.forEach(mediation => {
                if (mediation.vote === 1) total++;
                if (mediation.vote === 3) total--;
            });

            return total > 0 ? true : false;
        },
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
                        dismiss,
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
        },
    },
};
</script>