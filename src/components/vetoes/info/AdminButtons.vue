<template>
    <div>
        <div v-if="selectedVeto.mediations.length">
            <!-- conclude mediation... -->
            <div v-if="selectedVeto.status !== 'upheld' && selectedVeto.status !== 'withdrawn'">
                <!-- ...based on voting results -->
                <button
                    class="btn btn-sm btn-block btn-danger mb-2"
                    @click="concludeMediation($event)"
                >
                    {{ majorityUphold ? 'Uphold veto' : 'Withdraw veto' }}
                </button>
                <!-- ...regardless of voting results -->
                <button class="btn btn-sm btn-block btn-danger mb-2" @click="concludeMediation($event, true)">
                    Dismiss without mediation
                </button>
            </div>

            <!-- restart mediation if concluded -->
            <button
                v-else
                class="btn btn-sm btn-danger btn-block mb-2"
                @click="continueMediation($event, true)"
            >
                Re-initiate veto mediation
            </button>

            <!-- view conclusion discussion post -->
            <button class="btn btn-sm btn-block btn-nat mb-2" data-toggle="collapse" data-target="#conclusion">
                See full conclusion post <i class="fas fa-angle-down" />
            </button>
            <conclusion-post />

            <!-- view mediator forum PM -->
            <button class="btn btn-sm btn-block btn-nat mb-2" data-toggle="collapse" data-target="#forumMessage">
                See full forum PM <i class="fas fa-angle-down" />
            </button>
            <forum-pm />
        </div>

        <!-- set up veto for mediation -->
        <div v-else-if="selectedVeto.status !== 'upheld' && selectedVeto.status !== 'withdrawn'">
            <hr>

            <!-- specify mediators -->
            <div class="mb-2">
                <span>Exclude specific user(s):</span>
                <input
                    id="excludeUsers"
                    class="form-control ml-1 w-75 small"
                    type="text"
                    placeholder="username1, username2, username3..."
                ><br>
                <div class="small px-4">
                    The mapper and veto submitter are automatically excluded. Please manually exclude any guest difficulty creators and the nominating BNs.
                </div>
            </div>
            <button class="btn btn-sm btn-block btn-nat mb-2" @click="selectMediators($event)">
                {{ mediators ? 'Re-select mediators' : 'Select mediators' }}
            </button>

            <!-- begin mediation -->
            <button v-if="mediators && mediators.length" class="btn btn-sm btn-block btn-danger mb-2" @click="beginMediation($event)">
                Begin mediation
            </button>

            <!-- view mediators -->
            <div v-if="mediators" class="mt-2">
                <p>
                    Users:
                </p>
                <div id="usernames" class="mb-4 w-25 card card-body small">
                    <ul class="list-unstyled">
                        <li v-for="user in mediators" :key="user.id">
                            {{ user.username }}
                        </li>
                    </ul>
                </div>

                <!-- view mediator forum pm -->
                <button class="btn btn-sm btn-block btn-nat mb-2" data-toggle="collapse" data-target="#forumMessage">
                    See full forum PM <i class="fas fa-angle-down" />
                </button>
                <forum-pm />
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
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
    data() {
        return {
            mediators: null,
        };
    },
    computed: {
        ...mapGetters([
            'selectedVeto',
            'majorityUphold',
        ]),
    },
    methods: {
        async beginMediation (e) {
            const result = confirm(`Are you sure?`);

            if (result) {
                const veto = await this.executePost(`/vetoes/beginMediation/${this.selectedVeto.id}`, { mediators: this.mediators }, e);

                if (veto && !veto.error) {
                    this.$store.dispatch('updateVeto', veto);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Started veto mediation`,
                        type: 'success',
                    });
                }
            }
        },
        async concludeMediation (e, dismiss) {
            const result = confirm(`Are you sure?`);

            if (result) {
                const veto = await this.executePost(
                    `/vetoes/concludeMediation/${this.selectedVeto.id}`,
                    {
                        majorityUphold: this.majorityUphold,
                        dismiss,
                    },
                    e
                );

                if (veto && !veto.error) {
                    this.$store.dispatch('updateVeto', veto);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Concluded mediation`,
                        type: 'success',
                    });
                }
            }
        },

        async continueMediation (e) {
            const result = confirm(`Are you sure? This should only be done if a mistake was made.`);

            if (result) {
                const veto = await this.executePost(`/vetoes/continueMediation/${this.selectedVeto.id}`, {}, e);

                if (veto && !veto.error) {
                    this.$store.dispatch('updateVeto', veto);
                    this.$store.dispatch('updateToastMessages', {
                        message: `Re-opened mediation`,
                        type: 'success',
                    });
                }
            }
        },
        async selectMediators (e) {
            let excludeUsers = $('#excludeUsers').val().split(',');

            for (let i = 0; i < excludeUsers.length; i++) {
                excludeUsers[i] = excludeUsers[i].trim().toLowerCase();
            }

            excludeUsers.push(this.selectedVeto.beatmapMapper.toLowerCase(), this.selectedVeto.vetoer.username.toLowerCase());

            const result = await this.executePost('/vetoes/selectMediators', { mode: this.selectedVeto.mode, excludeUsers }, e);

            if (result && !result.error) {
                this.mediators = result;
            }
        },
    },
};
</script>