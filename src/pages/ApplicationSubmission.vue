<template>
    <div>
        <div class="card card-body mb-3">
            <div>The <a href="https://osu.ppy.sh/help/wiki/People/Beatmap_Nominators" target="_blank">Beatmap Nominators</a> (BN) are a group of users in charge of promoting Ranked beatmaps.</div>
            <div>Requirements for joining the BN:</div>
            <ul>
                <li>At least 200 Kudosu earned for osu! modders</li>
                <li>At least 150 Kudosu earned for osu!taiko/osu!catch/osu!mania modders</li>
                <li>A positive mod score (calculated by your modding activity in the last 3 months, see calculator on the <a href="http://bn.mappersguild.com">front page</a>). Mod score for returning BNs is calculated based on 1 or 2 months of activity</li>
                <li>A passing score on a Ranking Criteria knowledge test</li>
                <li>Competent modding abilities/behavior (evaluated by members of the NAT through your submitted mods, other modding history, and community interaction)</li>
            </ul>
            <div>If you meet the mod score/kudosu thresholds, you will have the option to begin a Ranking Criteria knowledge test after clicking "apply". This test has no time limit and can be completed at any time after your application is submitted. You cannot apply to other game modes while the test is incomplete.</div>
            <div>When your application is evaluated, you will receive an osu! forum PM with the results. If your application is denied or you are removed from the BN, you cannot apply to the same game mode again for 90 days.</div>
        </div>

        <div class="card card-body">
            <div class="row mb-2">
                <div class="col-sm-12">
                    <h4>Example mods:</h4>
                    <p class="small ml-4">
                        Link the discussion pages of at least two mapsets you have modded in the last six months. These (and potentially more) will be evaluated by the NAT.
                    </p>
                    <p class="small ml-4">
                        The following are modding traits expected of Beatmap Nominators
                    </p>
                    <ul class="small ml-1">
                        <li>Coverage of all difficulty levels</li>
                        <li>Identification of unrankable issues, including ones tools can't detect like timing/metadata</li>
                        <li>Comparisons of parts of a map to support issues/suggestions</li>
                        <li>A wide variety of map elements, such as rhythm, spacing, movement, intensity, contrast, and consistency.</li>
                        <li>Identification of both isolated issues and general map-wide issues</li>
                    </ul>
                </div>
            </div>

            <div class="row mb-2">
                <div class="col-sm-12">
                    <div v-for="i in 4" :key="i" class="form-group">
                        <p>Mod {{ i }}:</p>

                        <input
                            v-model="mods[i - 1]"
                            type="text"
                            class="form-control"
                            placeholder="link to beatmap discussion"
                            maxlength="1000"
                        >
                        <input
                            v-model="reasons[i - 1]"
                            type="text"
                            class="form-control"
                            placeholder="would you nominate this beatmap? if not, why?"
                            maxlength="1000"
                        >
                    </div>
                </div>
            </div>

            <h4>Game-mode:</h4>

            <div class="row mb-2">
                <div class="col-sm-12 pl-4">
                    <mode-radio-display v-model="selectedMode" />
                </div>
            </div>

            <div class="row">
                <div class="col-sm-12 text-center">
                    <template v-if="hasPendingTest">
                        <a href="/testsubmission" class="btn btn-primary btn-block">
                            Begin Ranking Criteria Test
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
import postData from '../mixins/postData';
import ToastMessages from '../components/ToastMessages.vue';
import ModeRadioDisplay from '../components/ModeRadioDisplay.vue';

export default {
    name: 'ApplicationSubmission',
    components: {
        ToastMessages,
        ModeRadioDisplay,
    },
    mixins: [ postData ],
    data () {
        return {
            hasPendingTest: false,
            selectedMode: '',
            mods: [],
            reasons: [],
            successInfo: '',
        };
    },
    async created () {
        const data = await this.initialRequest('/bnapps/relevantInfo');

        if (!data.error) {
            this.hasPendingTest = data.hasPendingTest;
        }
    },
    methods: {
        async apply (e) {
            this.successInfo = `Submitting & calculating mod score... (this will take a few seconds)`;

            const data = await this.executePost(`/bnapps/apply`, {
                mode: this.selectedMode,
                mods: this.mods,
                reasons: this.reasons,
            }, e);

            if (!data.error) {
                this.hasPendingTest = true;
            }

            this.successInfo = '';
        },
    },
};
</script>
