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
                    A positive <a href="/home" target="_blank">mod score</a>.
                    Returning BNs have different mod score requirements as
                    explained on the
                    <a
                        href="https://osu.ppy.sh/wiki/en/People/The_Team/Beatmap_Nominators/Becoming_a_Beatmap_Nominator#rejoining-after-being-removed-from-the-beatmap-nominators"
                        target="_blank"
                        >osu! wiki</a
                    >
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
                <a href="https://osu.ppy.sh/users/23648635" target="_blank"
                    >mappersguild bot</a
                >
                with the results. If your application is denied, you cannot
                apply to the same game mode again for 90 days (unless otherwise
                specified).
            </div>
        </div>

        <div class="card card-body">
            <div class="row mb-2">
                <div class="col-sm-12">
                    <h4>Example mods:</h4>
                    <p class="small ml-4">
                        Link the discussion pages of at least two mapsets you
                        have modded in the last six months. Try to include at
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
                        <li>Coverage of all difficulty levels</li>
                        <li>
                            Identification of unrankable issues, including ones
                            tools can't detect like timing/metadata
                        </li>
                        <li>
                            Comparisons of parts of a map to support
                            issues/suggestions
                        </li>
                        <li>
                            A wide variety of map elements, such as rhythm,
                            spacing, movement, intensity, contrast, and
                            consistency.
                        </li>
                        <li>
                            Identification of both isolated issues and general
                            map-wide issues
                        </li>
                        <li>
                            Consideration of mappers' intentions when
                            identifying issues and giving suggestions
                        </li>
                    </ul>
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
                                <li>
                                    Please provide a copy of the map before your
                                    mod was applied (optional)
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
                        <a
                            href="/testsubmission"
                            class="btn btn-success btn-block"
                        >
                            Begin Ranking Criteria Test
                        </a>

                        <p class="small mt-2">
                            Before your application can be reviewed, you must
                            take a short test.
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

export default {
    name: 'ApplicationSubmission',
    components: {
        ToastMessages,
        ModeRadioDisplay,
    },
    data() {
        return {
            hasPendingTest: false,
            selectedMode: '',
            mods: [],
            reasons: [],
            successInfo: '',
        };
    },
    async created() {
        const data = await this.$http.initialRequest('/bnapps/relevantInfo');

        if (!data.error) {
            this.hasPendingTest = data.hasPendingTest;
        }
    },
    methods: {
        async apply(e) {
            this.successInfo = `Submitting & calculating mod score... (this will take a few seconds)`;

            const data = await this.$http.executePost(
                `/bnapps/apply`,
                {
                    mode: this.selectedMode,
                    mods: this.mods,
                    reasons: this.reasons,
                },
                e
            );

            if (!data.error) {
                this.hasPendingTest = true;
            }

            this.successInfo = '';
        },
    },
};
</script>
