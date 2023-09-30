<template>
    <div>
        <div class="card card-body mb-3">
            <div>
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
                    At least 200
                    <a
                        href="https://osu.ppy.sh/wiki/en/Modding/Kudosu"
                        target="_blank"
                        >kudosu</a
                    >
                    for osu! modders or 150 kudosu for
                    osu!taiko/osu!catch/osu!mania modders
                </li>
                <li>
                    A score of 12.5 or higher on the
                    <a
                        href="https://osu.ppy.sh/wiki/en/People/The_Team/Beatmap_Nominators/Beatmap_Nominator_Test"
                        target="_blank"
                        >Beatmap Nominator Test</a
                    >
                    (this begins after clicking "Apply" below).
                </li>
                <li>
                    Competent modding abilities/behavior. This is evaluated by
                    the NAT through your submitted mods, other modding history,
                    and community interaction
                </li>
            </ul>
            <div>
                After your application is evaluated, you will receive an osu!
                message from the
                <a href="https://osu.ppy.sh/users/6616586" target="_blank"
                    >NAT bot</a
                >
                with the results. If your application is denied, you cannot
                apply to the same game mode again for 90 days (unless otherwise
                specified).
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
            <div v-if="!hasPendingTest">
                <h4>Game-mode</h4>

                <div class="row">
                    <div class="col-sm-12 pl-4">
                        <mode-radio-display v-model="selectedMode" />
                    </div>
                </div>

                

                <hr />

                <div v-if="!relevantResignation">
                    <div class="row mb-2">
                        <div class="col-sm-12">
                            <h4>Example mods</h4>
                            <p class="small ml-4">
                                Link the discussion pages of {{ wasBn ? "at least two" : "three" }} mapsets you
                                have modded in the last six months. Include at
                                least one map you would nominate and one you wouldn't,
                                so the NAT can understand your nomination quality
                                standards. These (and potentially more) will be
                                evaluated by the NAT.
                            </p>
                            <p class="small ml-4">
                                The following are modding traits expected of Beatmap
                                Nominators
                            </p>
                            <ul class="small ml-1">
                                <li>Coverage of all common difficulty levels.</li>
                                <ul class="ml-1">
                                    <li>
                                        Most beatmaps will have a spread of difficulties ranging from easy up to expert,
                                        and so Beatmap Nominators must be proficient in modding such difficulties.
                                        Proficiency in modding extremely high level difficulties is not required.
                                    </li>
                                </ul>
                                <li>
                                    Identification of unrankable issues, including ones tools cannot
                                    detect, such as incorrect timing or metadata.
                                </li>
                                <li>
                                    Comparison between parts of a beatmap
                                    to support issues or suggestions.
                                </li>
                                <ul class="ml-1">
                                    <li>
                                        Referencing other parts of the beatmap is useful for keeping suggestions
                                        in line with the original styles and ideas the mapper has in their map.
                                    </li>
                                </ul>
                                <li>
                                    Commentary about a wide variety of beatmap elements,
                                    such as rhythm, spacing, movement, intensity, contrast, and consistency.
                                </li>
                                <ul class="ml-1">
                                    <li>
                                        While Beatmap Nominators are encouraged to ask for help when needed,
                                        they should be able to judge almost all aspects of mapping independently to a decent level.
                                    </li>
                                </ul>
                                <li>
                                    Identification of both isolated issues and general
                                    map-wide issues.
                                </li>
                                <li>
                                    Consideration of mappers' intentions when
                                    identifying issues and giving suggestions.
                                </li>
                                <ul class="ml-1">
                                    <li>
                                        Avoid suggesting your own mapping styles or preferences if they contradict the mapper's intended style.
                                        If there is an issue related to the mapper's style,
                                        try to frame your suggestions around what they originally intended.
                                    </li>
                                </ul>
                                <li>
                                    Ability to make useful suggestions and spot mistakes for mappers of varying experience levels.
                                </li>
                                <ul class="ml-1">
                                    <li>
                                        Beatmap Nominators will often deal with very experienced mappers or high-quality maps
                                        which may not require much feedback. It is important therefore to still be able to spot
                                        mistakes and suggest improvements for even the most seasoned of mappers.
                                    </li>
                                    <li>
                                        For the application, it is not recommended to submit mods on maps from beginner mappers
                                        which lack the fundamentals. Instead, submitted mods should be on maps that are ready for a BN to look at.
                                    </li>
                                </ul>
                                <li>
                                    Clear communication with the mapper.
                                </li>
                                <ul class="ml-1">
                                    <li>
                                        Mod posts should explain the issue and the solution as clearly and concisely as possible to avoid confusing the mapper,
                                        or even having their suggestion applied incorrectly. Specialised terminology should also generally be avoided.
                                    </li>
                                </ul>
                            </ul>
                            <p>For more information about the application process and cooldowns, please check out 
                                <a href="https://osu.ppy.sh/wiki/en/People/Beatmap_Nominators/Becoming_a_Beatmap_Nominator#application-process" target="_blank">this page</a>.
                            </p>
                        </div>
                    </div>

                    <div class="row mb-2">
                        <div class="col-sm-12">
                            <div v-for="i in 3" :key="i" class="form-group">
                                <p>Mod {{ i }}:</p>

                                <input
                                    v-model="mods[i - 1]"
                                    type="text"
                                    class="form-control ml-2 mb-2"
                                    placeholder="link to beatmap discussion"
                                    maxlength="1000"
                                />

                                <div class="ml-2 small">
                                    Additional mod info
                                    <ul>
                                        <li>
                                            Would you nominate this beatmap? If not,
                                            why?
                                        </li>
                                        <li>
                                            Is there anything else you'd like the NAT to
                                            know about this mod?
                                        </li>
                                    </ul>
                                </div>

                                <textarea
                                    v-model="reasons[i - 1]"
                                    type="text"
                                    class="form-control ml-2"
                                    placeholder="responses to the bullet points above"
                                    maxlength="1000"
                                    rows="2"
                                />

                                <div class="ml-2 small">
                                        Please provide a copy of the map before your mod was applied. If you do not have a copy of the map, write "none":
                                </div>

                                <input
                                    v-model="oszs[i - 1]"
                                    type="text"
                                    class="form-control ml-2 mb-2"
                                    placeholder="link to .osz of map before mod was applied"
                                    maxlength="1000"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-sm-12 text-center">
                    <template v-if="relevantResignation">
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
                            This option is available until {{ this.$moment(relevantResignation.archivedAt).add(6, 'months').format('YYYY-MM-DD') }} because you recently resigned from the {{ relevantResignation.mode == 'osu' ? 'osu!' : 'osu!' + relevantResignation.mode }} Beatmap Nominators.
                        </p>
                        <p class="small mt-2">
                            You will not need to take the Ranking Criteria test. The NAT will review for any potential concerns and re-admit you to the Beatmap Nominators if everything is okay!
                        </p>
                    </template>
                    <template v-else-if="hasPendingTest">
                        <a
                            href="/testsubmission"
                            class="btn btn-success btn-block"
                        >
                            Begin Ranking Criteria test
                        </a>

                        <p class="small mt-2">
                            Before your application can be reviewed, you must take a short test.
                        </p>
                    </template>

                    <template v-else>
                        <button
                            class="btn btn-block btn-primary"
                            type="button"
                            @click="apply($event)"
                        >
                            Apply
                        </button>
                        <div v-if="successInfo" class="mt-2 small">
                            {{ successInfo }}
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <toast-messages />
    </div>
</template>

<script>
import ToastMessages from '../components/ToastMessages.vue';
import ModeRadioDisplay from '../components/ModeRadioDisplay.vue';
import { mapState } from 'vuex';

export default {
    name: 'ApplicationSubmission',
    components: {
        ToastMessages,
        ModeRadioDisplay,
    },
    data() {
        return {
            hasPendingTest: false,
            resignations: [],
            cooldownApps: [],
            cooldownEvals: [],
            cooldownResignations: [],
            relevantResignation: null,
            cooldown: false,
            selectedMode: 'osu',
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
        }
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
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
        wasBn() {
            return this.loggedInUser.history && this.loggedInUser.history.length;
        },
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
