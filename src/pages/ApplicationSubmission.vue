<template>
    <div>
        <div v-if="!loggedInUser.isNat" class="card card-body mb-3">
            <h5>Beatmap Nominator applications are closed for now. Come back in a week!</h5>
        </div>
        <span v-else>
            <!-- static info -->
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
                <hr>
                <div>
                    As part of <a href="https://osu.ppy.sh/community/forums/topics/1898076" target="_blank">recent BN application process changes</a>, a few things are still under construction! Thanks for your patience. :)
                </div>
            </div>

            <hr />

            <!-- cooldowns -->
            <template v-if="outstandingCooldowns.length">
                <div class="card card-body">
                    <h4>Application status</h4>
                    You have one or more outstanding cooldowns that prevents you from joining the Beatmap Nominators for the following modes:
                    <ul class="text-danger">
                        <li v-for="evaluation in outstandingCooldowns" :key="evaluation.id">{{ evaluation.mode == 'osu' ? 'osu!' : 'osu!' + evaluation.mode }}: {{ evaluation.active ? 'Evaluation in progress' : evaluation.date }}</li>
                    </ul>
                </div>
                <hr />
            </template>

            <!-- instant rejoin -->
            <template v-if="relevantResignation && !outstandingCooldowns.length">
                <div class="card card-body">
                    <h4>Bypass application</h4>
                    <p class="mt-2">
                        This option is available until {{ this.$moment(relevantResignation.archivedAt).add(1, 'years').format('YYYY-MM-DD') }} because you recently resigned from the {{ relevantResignation.mode == 'osu' ? 'osu!' : 'osu!' + relevantResignation.mode }} Beatmap Nominators.
                    </p>
                    <p class="mt-2">
                        The NAT will review for any potential concerns and re-admit you to the Beatmap Nominators if everything is okay!
                    </p>
                    <button
                        v-if="!successInfo"
                        class="btn btn-block btn-success"
                        type="button"
                        @click="rejoinApply($event)"
                    >
                        Request to re-join the Beatmap Nominators ({{ relevantResignation.mode == 'osu' ? 'osu!' : 'osu!' + relevantResignation.mode }})
                    </button>
                    <p v-if="successInfo" class="mt-2">
                        {{ successInfo }}    
                    </p>
                    
                </div>
                <hr />
            </template>

            <!-- application -->
            <div class="card card-body">
                <!-- game modes -->
                <div>
                    <h4>Game mode</h4>

                    <mode-select
                        v-model="selectedMode"
                        :max-selection="1"
                    />
                </div>

                <hr />

                <!-- beatmaps -->
                <div v-if="step < 4">
                    <div v-for="i in 3" :key="i">
                        <div v-if="step == i">
                            <h4>Beatmap {{ i }}</h4>
                            <div v-if="i == 1">
                                Submit your mod on a map that is <b>ready to be nominated.</b> (...or ready to be nominated after your mod is applied)
                                <div class="small text-secondary"><small>This intends to show your ability to conduct the final steps of the modding process and independently evaluate a map's readiness for Ranked.</small></div>
                                <div class="mt-2">This map should...</div>
                                <ul>
                                    <li>have 0 nominations when the application is submitted</li>
                                </ul>
                            </div>
                            <div v-else-if="i == 2">
                                Submit your mod on a map that is <b>NOT ready to be nominated without significant improvements.</b>
                                <div class="small text-secondary"><small>This intends to show your issue identification skills, communication skills, and understanding of standards for Ranked maps.</small></div>
                                <div class="mt-2">This map should...</div>
                                <ul>
                                    <li>include Normal, Hard, and Insane difficulties</li>
                                    <li>be created by different mappers from the previous map</li>
                                </ul>
                            </div>
                            <div v-else-if="i == 3">
                                Submit your mod on a map that, in your opinion, <b>proves you're able to judge map quality and readiness for Ranked.</b> You're free to choose a map that you would or would <i>not</i> nominate.
                                <div class="small text-secondary"><small>This gives you an opportunity to fill any missing gaps your application, keeping in mind the intentions stated in the descriptions of the previous submissions.</small></div>
                                <div class="mt-2">This map should...</div>
                                <ul>
                                    <li>have 0 nominations when the application is submitted</li>
                                    <li>be created by different mappers from the previous maps</li>
                                </ul>
                            </div>
                            
                            <input
                                v-model="mods[i - 1]"
                                type="text"
                                class="form-control ml-2 mb-2"
                                placeholder="beatmap link"
                                maxlength="1000"
                            />

                            <hr />

                            <div class="ml-2">
                                <div v-if="i == 1">Briefly describe why the map is ready (or nearly ready) to be nominated:</div>
                                <div v-if="i == 2">Briefly explain why the map is NOT ready to be nominated (use your modding to back up your reasons!):</div>
                                <div v-if="i == 3">
                                    Respond to either of these:
                                    <ul>
                                    <li>Briefly describe why the map is ready (or nearly ready) to be nominated</li>
                                    <li>Briefly explain why the map is NOT ready to be nominated</li>
                                </ul></div>
                            </div>

                            <textarea
                                v-model="reasons[i - 1]"
                                type="text"
                                class="form-control ml-2 mb-2"
                                placeholder="response"
                                maxlength="1000"
                                rows="2"
                            />

                            <b v-if="step == i && reasons[i - 1] && reasons[i - 1].length > 800" class="text-danger float-right">{{ reasons[i - 1].length }}/1000</b>

                            <hr />

                            <div class="ml-2">
                                Please provide a copy of the map before your mod was applied. If you don't have it, write "none":
                            </div>

                            <input
                                v-model="oszs[i - 1]"
                                type="text"
                                class="form-control ml-2 mb-2"
                                placeholder=".osz link"
                                maxlength="1000"
                            />
                        </div>
                    </div>
                </div>

                <!-- review -->
                <div v-if="step == 4">
                    <h4>Review</h4>
                    <div v-for="i in 3" :key="i" class="small text-secondary">
                        <div v-if="mods[i - 1] || reasons[i - 1] || oszs[i - 1]">
                            <div>
                                Beatmap {{ i }}:
                                <a v-if="mods[i - 1]" :href="mods[i - 1]" target="_blank" class="small">{{ mods[i - 1] }}</a>
                            </div>
                            <div>
                                .osz link:
                                <a v-if="oszs[i - 1]" :href="oszs[i - 1]" target="_blank" class="small">{{ oszs[i - 1] }}</a>
                            </div>
                            <div>
                                Response:
                                <div v-if="reasons[i - 1]" class="pre-line small" v-html="$md.render(reasons[i - 1].trim())" />
                            </div>
                        </div>
                        
                    </div>
                    <div class="text-danger mt-4" v-if="!selectedMode || mods.length !== 3 || reasons.length !== 3 || oszs.length !== 3"">
                        Missing application details:
                        <ul>
                            <li v-if="!selectedMode">Game mode</li>
                            <li v-if="mods.length !== 3">Beatmap links (current: {{ mods.length }} - required: 3)</li>
                            <li v-if="reasons.length !== 3">Responses (current: {{ reasons.length }} - required: 3)</li>
                            <li v-if="oszs.length !== 3">.osz links (current: {{ reasons.length }} - required: 3)</li>
                        </ul>
                    </div>

                    <!-- comment -->
                    <div class="mb-2">
                        If you have anything to say to the people evaluating your application, write it here! (optional):
                            <input
                            v-model="comment"
                            class="form-control"
                            type="text"
                            maxlength="1000"
                            placeholder="comment..."
                        >
                    </div>

                    <!-- public visibility -->
                    <div class="form-check mb-2">
                        <input
                            v-model="isPublic"
                            id="public-application"
                            type="checkbox"
                            class="form-check-input"
                        >
                        <label
                            class="form-check-label text-secondary"
                            for="public-application"
                        >
                            Allow anyone to see your application
                        </label>
                    </div>
                    
            
                    <button
                        class="btn btn-block btn-success"
                        type="button"
                        @click="apply($event)"
                        :disabled="!selectedMode || mods.length !== 3 || reasons.length !== 3 || oszs.length !== 3"
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

                <!-- bottom buttons -->
                <div class="row">
                    <div v-if="step != 1" :class="step == 4 ? 'col-sm-12' : 'col-sm-6'">
                        <button
                            class="btn btn-block btn-primary mt-2"
                            type="button"
                            @click="step--"
                        >
                            <i class="ml-1 fas fa-arrow-left" />    
                            Back
                        </button>
                    </div>
                    <div v-if="step != 4" :class="step == 1 ? 'col-sm-12' : 'col-sm-6'">
                        <button
                            class="btn btn-block btn-primary mt-2"
                            type="button"
                            @click="step++"
                        >
                            Next
                            <i class="ml-1 fas fa-arrow-right" />
                        </button>
                    </div>
                </div>
            </div>
        </span>

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
            step: 1,
            resignations: [],
            cooldownApps: [],
            cooldownEvals: [],
            cooldownResignations: [],
            relevantResignation: null,
            cooldown: false,
            selectedMode: '',
            mods: [],
            reasons: [],
            oszs: [],
            comment: '',
            isPublic: false,
            successInfo: '',
        };
    },
    async created() {
        const data = await this.$http.initialRequest('/bnapps/relevantInfo');

        if (!data.error) {
            this.resignations = data.resignations;
            this.cooldownApps = data.cooldownApps;
            this.cooldownEvals = data.cooldownEvals;
            this.cooldownResignations = data.cooldownResignations;
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
                            comment: this.comment,
                            isPublic: this.isPublic,
                        },
                        e
                    );

                    this.successInfo = '';

                    if (data && !data.error) {
                        this.cooldownApps.push({
                            id: 'temp',
                            mode: this.selectedMode,
                            date: new Date(),
                            active: true,
                        });
                        this.step = 1;
                        this.mods = [];
                        this.reasons = [];
                        this.oszs = [];
                        this.selectedMode = '';
                        this.comment = '';
                        this.isPublic = false;
                    }
                }
            }
        },
        async rejoinApply(e) {
            this.successInfo = `Submitting... (this will take a few seconds)`;
            const data = await this.$http.executePost(
                `/bnapps/rejoinApply`,
                {
                    mode: this.selectedMode,
                },
                e
            );

            this.successInfo = '';

            if (data && !data.error) {
                this.cooldownApps.push({
                    id: 'temp',
                    mode: this.selectedMode,
                    date: new Date(),
                    active: true,
                });
            }
        },
    },
};
</script>
