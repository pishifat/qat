<template>
    <div>
        <div class="card card-body mb-3">
            <div class="mb-3">
                The
                <a
                    href="https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators"
                    target="_blank"
                    >Beatmap Nominators</a
                >
                (BN) are a group of users in charge of promoting Ranked
                beatmaps.
            </div>
            <div>Requirements for joining the BN:</div>
            <ul>
                <li>
                    At least 150
                    <a
                        href="https://osu.ppy.sh/wiki/en/Modding/Kudosu"
                        target="_blank"
                        >kudosu</a
                    >
                </li>
                <li>
                    An ability to recognise maps that should (and should not) be nominated
                </li>
                <li>
                    No outstanding behaviour issues
                </li>
            </ul>
            <div>
                After your application is evaluated, you will receive an osu!
                message from the
                <a href="https://osu.ppy.sh/users/6616586" target="_blank"
                    >NAT bot</a
                >
                with the results. If your application is denied, you cannot
                apply to the same game mode again for 60 days.
            </div>
        </div>

        <hr />

        <template v-if="outstandingCooldowns.length">
            <div class="card card-body">
                <h4>Notice</h4>
                You have one or more outstanding cooldowns that prevents you from joining the Beatmap Nominators for the following modes:
                <ul class="text-danger">
                    <li v-for="evaluation in outstandingCooldowns" :key="evaluation.id">{{ evaluation.mode == 'osu' ? 'osu!' : 'osu!' + evaluation.mode }}: {{ evaluation.active ? 'Evaluation in progress' : evaluation.date }}</li>
                </ul>
            </div>
            <hr />
        </template>

        <div class="card card-body">
            <!-- game mode -->
            <div v-if="step == 0">
                <h4>Game mode</h4>

                <mode-select
                    v-model="selectedMode"
                    :max-selection="1"
                />
            </div>

            <!-- beatmap 1 -->
            <div v-if="step == 1">
                <h4>Beatmap 1</h4>
                    <div class="ml-2">
                        Submit a beatmap that...
                        <ul>
                            <li>Has 0 nominations</li>
                            <li>You would nominate if you were a BN</li>
                        </ul>
                    </div>

                    <input
                        v-model="mods[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder="beatmap link"
                        maxlength="1000"
                    />

                    <div class="ml-2">
                        Answer these questions:
                        <ul>
                            <li>In general, what do you think is required for a map to be rankable?</li>
                            <li>Why do you believe this beatmap is ready to be nominated?</li>
                        </ul>
                    </div>

                    <textarea
                        v-model="reasons[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder="responses"
                        maxlength="1000"
                        rows="2"
                    />

                    <div class="ml-2">
                        Provide a copy of the map at the time of your application. If it's updated, your decision to nominate might change!
                    </div>

                    <input
                        v-model="oszs[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder=".osz link (current)"
                        maxlength="1000"
                    />
            </div>

            <!-- beatmap 2 -->
            <div v-if="step == 2">
                <h4>Beatmap 2</h4>
                    <div class="ml-2">
                        Submit a beatmap that...
                        <ul>
                            <li>Was created by a different mapper</li>
                            <li>Was improved by your mod</li>
                            <li>Has 0 nominations</li>
                            <li>You would nominate if you were a BN</li>
                        </ul>
                    </div>

                    <input
                        v-model="mods[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder="beatmap link"
                        maxlength="1000"
                    />

                    <div class="ml-2">
                        Answer these questions:
                        <ul>
                            <li>How did your mod improve this beatmap?</li>
                            <li>Why do you believe this beatmap is ready to be nominated?</li>
                        </ul>
                    </div>

                    <textarea
                        v-model="reasons[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder="responses"
                        maxlength="1000"
                        rows="2"
                    />

                    <div class="ml-2">
                        Provide a copy of the map <i>before</i> your mod was applied. If you can't find this, write "none".
                    </div>

                    <input
                        v-model="oszs[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder=".osz link (before mod)"
                        maxlength="1000"
                    />

                    <div class="ml-2">
                        Provide a copy of the map at the time of your application. If it's updated, your decision to nominate might change!
                    </div>

                    <input
                        v-model="oszs[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder=".osz link (current)"
                        maxlength="1000"
                    />
            </div>

            <!-- beatmap 3 -->
            <div v-if="step == 3">
                <h4>Beatmap 3</h4>
                    <div class="ml-2">
                        Submit a beatmap that...
                        <ul>
                            <li>Was created by a different mapper</li>
                            <li>You would NOT nominate if you were a BN</li>
                        </ul>
                    </div>

                    <input
                        v-model="mods[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder="beatmap link"
                        maxlength="1000"
                    />

                    <div class="ml-2">
                        Answer these questions:
                        <ul>
                            <li>Why is this beatmap NOT ready to be nominated?</li>
                            <li>What needs to be changed to make the beatmap worth nominating?</li>
                        </ul>
                    </div>

                    <textarea
                        v-model="reasons[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder="responses"
                        maxlength="1000"
                        rows="2"
                    />

                    <div class="ml-2">
                        Provide a copy of the map at the time of your application. If it's updated, your decision to nominate might change!
                    </div>

                    <input
                        v-model="oszs[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder=".osz link (current)"
                        maxlength="1000"
                    />
            </div>

            <!-- beatmap 4 -->
            <div v-if="step == 4">
                <h4>Beatmap 4</h4>
                    <div class="ml-2">
                        Submit a beatmap that...
                        <ul>
                            <li>Was created by a different mapper</li>
                            <li>Was improved by your mod</li>
                            <li>You would NOT nominate if you were a BN</li>
                        </ul>
                    </div>

                    <input
                        v-model="mods[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder="beatmap link"
                        maxlength="1000"
                    />

                    <div class="ml-2">
                        Answer these questions:
                        <ul>
                            <li>How did your mod improve this beatmap?</li>
                            <li>Why is this beatmap NOT ready to be nominated?</li>
                            <li>What needs to be changed to make the beatmap worth nominating?</li>
                        </ul>
                    </div>

                    <textarea
                        v-model="reasons[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder="responses"
                        maxlength="1000"
                        rows="2"
                    />

                    <div class="ml-2">
                        Provide a copy of the map <i>before</i> your mod was applied. If you can't find this, write "none".
                    </div>

                    <input
                        v-model="oszs[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder=".osz link (before mod)"
                        maxlength="1000"
                    />

                    <div class="ml-2">
                        Provide a copy of the map at the time of your application. If it's updated, your decision to nominate might change!
                    </div>

                    <input
                        v-model="oszs[i - 1]"
                        type="text"
                        class="form-control ml-2 mb-2"
                        placeholder=".osz link (current)"
                        maxlength="1000"
                    />
            </div>

            <div v-if="step == 5">
                (list of everything the user submitted)
                <button
                    class="btn btn-block btn-success"
                    type="button"
                    @click="apply($event)"
                >
                    Apply for BN
                    <mode-display
                        :modes="[selectedMode]"
                    />
                </button>
                <div v-if="successInfo" class="mt-2 small">
                    {{ successInfo }}
                </div>
            </div>
            <hr />
            <div class="row">
                <div v-if="step != 0" :class="step == 5 ? 'col-sm-12' : 'col-sm-6'">
                    <button
                        class="btn btn-block btn-primary mt-2"
                        type="button"
                        @click="step--"
                    >
                        <i class="ml-1 fas fa-arrow-left" />    
                        Back
                    </button>
                </div>
                <div v-if="step != 5" :class="step == 0 ? 'col-sm-12' : 'col-sm-6'">
                    <button
                        class="btn btn-block btn-primary mt-2"
                        type="button"
                        @click="step++"
                        :disabled="!selectedMode"
                    >
                        Next
                        <i class="ml-1 fas fa-arrow-right" />
                    </button>
                </div>
                
            </div>

            <!--<div v-if="!hasPendingTest">
                <div v-if="!relevantResignation || recentlyRemovedForLowActivity">
                    <div class="row mb-2">
                        <div class="col-sm-12">
                            <h4>Application</h4>
                            <p class="ml-2">
                                As a Beatmap Nominator, the main thing you'll be doing is... nominating beatmaps!
                            </p>
                            <p class="ml-2">
                                In this application, your goal is to prove that you know what maps should (and should not) be nominated for Ranked status. Read everything below carefully, and explain your thought processes as clearly as possible!
                            </p>
                            <p class="ml-2">
                                If you struggle with English, write with the language that's easiest for you. The people reviewing your application will try to find a translator.
                            </p>
                        </div>
                    </div>

                    <div class="row mb-2">
                        <div class="col-sm-12">
                            <div class="form-group">
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>-->

            <div v-if="relevantResignation && !outstandingCooldowns.length && !recentlyRemovedForLowActivity" class="row">
                <div class="col-sm-12 text-center">
                    <button
                        v-if="!successInfo"
                        class="btn btn-block btn-success"
                        type="button"
                        @click="rejoinApply($event)"
                    >
                        Request to re-join the Beatmap Nominators
                    </button>
                    <p v-if="successInfo" class="mt-2">
                        {{ successInfo }}    
                    </p>
                    <p class="small mt-2">
                        This option is available until {{ this.$moment(relevantResignation.archivedAt).add(1, 'years').format('YYYY-MM-DD') }} because you recently resigned from the {{ relevantResignation.mode == 'osu' ? 'osu!' : 'osu!' + relevantResignation.mode }} Beatmap Nominators.
                    </p>
                    <p class="small mt-2">
                        You will not need to take the Ranking Criteria test. The NAT will review for any potential concerns and re-admit you to the Beatmap Nominators if everything is okay!
                    </p>
                </div>
            </div>
        </div>

        <h4></h4>

        <toast-messages />
    </div>
</template>

<script>
import ToastMessages from '../components/ToastMessages.vue';
import ModeSelect from '../components/ModeSelect.vue';
import ModeDisplay from '../components/ModeDisplay.vue';
import { mapState } from 'vuex';

export default {
    name: 'ApplicationSubmission',
    components: {
        ToastMessages,
        ModeSelect,
        ModeDisplay,
    },
    data() {
        return {
            step: 0,
            hasPendingTest: false,
            resignations: [],
            cooldownApps: [],
            cooldownEvals: [],
            cooldownResignations: [],
            recentlyRemovedForLowActivity: false,
            relevantResignation: null,
            cooldown: false,
            selectedMode: '',
            mods: [],
            reasons: [],
            oszs: [],
            successInfo: '',
        };
    },
    async created() {
        const data = await this.$http.initialRequest('/bnapps/relevantInfo');

        if (!data.error) {
            this.hasPendingTest = data.hasPendingTest;
            this.resignations = data.resignations;
            this.cooldownApps = data.cooldownApps;
            this.cooldownEvals = data.cooldownEvals;
            this.cooldownResignations = data.cooldownResignations;
            this.recentlyRemovedForLowActivity = data.recentlyRemovedForLowActivity;
        }

        this.relevantResignation = [...this.resignations].find(r => r.mode == this.selectedMode);
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        wasBn() {
            return this.loggedInUser.history && this.loggedInUser.history.length;
        },
        outstandingCooldowns() {
            const cooldowns = [];

            for (const app of this.cooldownApps) {
                cooldowns.push({
                    id: app.id,
                    mode: app.mode,
                    date: new Date(app.cooldownDate),
                    active: app.active,
                });
            };

            for (const evaluation of this.cooldownEvals) {
                cooldowns.push({
                    id: evaluation.id,
                    mode: evaluation.mode,
                    date: new Date(evaluation.cooldownDate),
                    active: evaluation.active,
                });
            }

            for (const resignation of this.cooldownResignations) {
                cooldowns.push({
                    id: resignation.id,
                    mode: resignation.mode,
                    date: new Date(resignation.cooldownDate),
                    active: resignation.active,
                });
            };

            return cooldowns;
        },
    },
    watch: {
        selectedMode() {
            this.successInfo = '';
            this.relevantResignation = [...this.resignations].find(r => r.mode == this.selectedMode);

            let cooldownApp;
    
            if (this.cooldownApps && this.cooldownApps.length) {
                cooldownApp = Boolean([...this.cooldownApps].find(a => a.mode == this.selectedMode));
            }

            let cooldownEval;

            if (this.cooldownEvals && this.cooldownEvals.length) {
                cooldownEval = Boolean([...this.cooldownEvals].find(e => e.mode == this.selectedMode))
            } 
            
            this.cooldown = Boolean(cooldownApp) || Boolean(cooldownEval);
        },
    },
    methods: {
        async apply(e) {
            let missingLinkCount = 0;

            for (const osz of this.oszs) {
                if (osz && osz.length && osz.indexOf('https://') < 0 && osz.trim() !== 'none') {
                    missingLinkCount++;
                }
            }

            let result = true;

            if (missingLinkCount > 0) {
                result = confirm(`${missingLinkCount} of your submissions ${missingLinkCount == 1 ? 'is' : 'are'} missing the .osz link${missingLinkCount == 1 ? '' : 's'}. If you have a copy of the map, press "Cancel" and add it!`);
            }

            if (result) {
                const result2 = confirm(`Are you sure you want to apply to join the ${this.selectedMode === 'osu' ? 'osu!' : 'osu!' + this.selectedMode} Beatmap Nominators?`);
                if (result2) {
                    this.successInfo = `Submitting... (this will take a few seconds)`;

                    const data = await this.$http.executePost(
                        `/bnapps/apply`,
                        {
                            mode: this.selectedMode,
                            mods: this.mods,
                            reasons: this.reasons,
                            oszs: this.oszs,
                        },
                        e
                    );

                    if (!data.error) {
                        this.hasPendingTest = true;
                    }

                    this.successInfo = '';
                }
            }
        },
        async rejoinApply(e) {
            const data = await this.$http.executePost(
                `/bnapps/rejoinApply`,
                {
                    mode: this.selectedMode,
                },
                e
            );

            this.successInfo = 'The NAT will review your re-join request!';
        },
    },
};
</script>
