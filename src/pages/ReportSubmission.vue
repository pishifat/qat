<template>
    <div>
        <section class="card card-body mb-3">
            <p>Reports can be made about anything mapping/modding related, including but not limited to:</p>
            <ul>
                <li>Beatmap songs violating osu!'s <a href="https://osu.ppy.sh/wiki/en/Rules/Song_Content_Rules" target="_blank">Song Content Rules</a></li>
                <li>Beatmap backgrounds (or other visual assets) violating osu!'s <a href="https://osu.ppy.sh/wiki/Rules/Visual_Content_Considerations" target="_blank">Visual Content Considerations</a></li>
                <li>A member of the BN violating osu!'s <a href="https://osu.ppy.sh/wiki/Rules/Code_of_Conduct_for_Modding_and_Mapping" target="_blank">Code of Conduct</a>, <a href="https://osu.ppy.sh/wiki/People/The_Team/Beatmap_Nominators/Rules" target="_blank">BN Rules</a>, or <a href="https://osu.ppy.sh/wiki/People/The_Team/Beatmap_Nominators/Expectations" target="_blank">Expectations for the BN</a></li>
            </ul>
            <p>Most reports are evaluated by the GMT/NAT on a case-by-case basis. In special cases, members of the BN/GMT/NAT evaluate inappropriate content through anonymous votes.</p>
            <p>Excluding those special cases, authors of reports are anonymous until a consensus is met. The consensus will be relayed to you via osu! chat.</p>
        </section>

        <section class="card card-body">
            <div class="row mb-2">
                <div class="col-sm-12">
                    <h4>Type of report:</h4>
                    <select
                        v-model="category"
                        class="form-control my-1"
                    >
                        <option value="" disabled>
                            Select a category
                        </option>
                        <option value="contentCaseSong">
                            Song Content Rules violation
                        </option>
                        <option value="contentCaseVisual">
                            Visual Content Considerations violation
                        </option>
                        <option value="behavior">
                            Inappropriate behavior from a BN
                        </option>
                        <option value="beatmap">
                            Beatmap
                        </option>
                        <option value="other">
                            Other
                        </option>
                    </select>
                </div>
            </div>

            <div v-if="category && category.length">
                <div v-if="category == 'contentCaseVisual' || category == 'contentCaseSong'" class="row mb-2">
                    <div class="col-sm-12">
                        <b>Note:</b> Content in ranked maps will not be changed unless it is severely inappropriate. Please focus reports on inappropriate songs or visuals from qualified or soon-to-be-qualified maps. For other maps, please use the beatmap report system on osu-web.
                    </div>
                </div>

                <div v-if="category == 'behavior'">
                    Before submitting a behavior report, check the <a href="https://osu.ppy.sh/wiki/Reporting_bad_behaviour" target="_blank">reporting policy on the osu! wiki</a>.
                </div>

                <div v-if="category == 'beatmap'">
                    If a beatmap you created is stolen and you want it removed from the beatmap listing, send notice to <code>copyright@ppy.sh</code> from as per osu!'s <a href="https://osu.ppy.sh/legal/Copyright" target="_blank">copyright policy</a>. Your notice should come from the email address linked to your osu! account.
                </div>

                <hr>

                <div>
                    <div class="row mb-2">
                        <div class="col-sm-12">
                            <h4>{{ primaryLinkHeader }}</h4>
                            <p class="small text-secondary">
                                {{ primaryLinkSubheader }}
                            </p>
                            <input
                                v-model="link"
                                type="text"
                                class="form-control"
                                placeholder="link..."
                                maxlength="150"
                                autocomplete="off"
                            >
                        </div>
                    </div>

                    <div v-if="category == 'behavior' || category == 'other'" class="row mb-2">
                        <div class="col-sm-12">
                            <h4>Username:</h4>
                            <p class="small text-secondary">
                                If your report pertains to a member of the BN, include their name. Otherwise leave empty.
                            </p>

                            <input
                                v-model="username"
                                type="text"
                                class="form-control"
                                placeholder="username..."
                                maxlength="18"
                                autocomplete="off"
                            >
                        </div>
                    </div>

                    <div class="row mb-2">
                        <div class="col-sm-12">
                            <h4>{{ reasonHeader }}</h4>
                            <p class="small text-secondary">
                                {{ reasonSubheader }}
                            </p>

                            <textarea
                                v-model="reason"
                                class="form-control"
                                rows="4"
                                maxlength="5000"
                            />
                        </div>
                    </div>

                    <div v-if="category == 'contentCaseVisual'" class="row col-sm-12">
                        <p>Video submission:</p>
                        <div class="row ml-1">
                            <label
                                class="mx-1"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="content is NOT a video"
                            >
                                <input
                                    v-model="videoStatus"
                                    type="radio"
                                    class="cross-radio hide-default"
                                    name="isVideo"
                                    value="noVideo"
                                >
                                <i class="fas fa-times fa-lg" />
                            </label>
                            <label
                                class="mx-1"
                                data-toggle="tooltip"
                                data-placement="top"
                                title="content is a video"
                            >
                                <input
                                    v-model="videoStatus"
                                    type="radio"
                                    class="checkmark-radio hide-default"
                                    name="isVideo"
                                    value="isVideo"
                                >
                                <i class="fas fa-check fa-lg" />
                            </label>
                        </div>
                    </div>

                    <small v-if="category == 'contentCaseVisual'" class="mb-3 row col-sm-12">If this is a video submission, you'll need to provide timestamps of the clips that need to be reviewed</small>

                    <div v-if="category == 'contentCaseVisual' && isVideoSubmission" class="row mb-3 col-sm-12">
                        <small class="mb-1">Timestamps:</small>
                        <textarea
                            v-model="timestamps"
                            class="form-control col-sm-12"
                            placeholder="timestamps..."
                            rows="3"
                        />
                    </div>

                    <div class="row">
                        <div class="col-sm-12 text-center">
                            <button
                                class="btn btn-primary btn-block"
                                type="button"
                                @click="submit($event)"
                            >
                                Submit Report
                            </button>

                            <div
                                v-if="successInfo"
                                class="pt-2 text-success small"
                            >
                                {{ successInfo }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <toast-messages />
    </div>
</template>

<script>
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'ReportSubmission',
    components: {
        ToastMessages,
    },
    data () {
        return {
            username: '',
            reason: '',
            link: '',
            successInfo: '',
            category: '',
            videoStatus: '',
            timestamps: '',
        };
    },
    computed: {
        primaryLinkHeader () {
            switch (this.category) {
                case 'stolenBeatmap':
                    return 'Link to stolen beatmap:';
                case 'beatmap':
                    return 'Link to beatmap:';
                case 'contentCaseSong':
                    return 'Link to song or beatmap:';
                case 'contentCaseVisual':
                    return 'Link to image or video:';
                case 'behavior':
                    return 'Link to inappropriate behavior:';
                default:
                    return 'Link:';
            }
        },
        primaryLinkSubheader () {
            switch (this.category) {
                case 'contentCaseVisual':
                    return 'Direct link to image works best (usually URL ending in .jpg or .png)';
                case 'behavior':
                case 'other':
                    return 'If multiple links are necessary, post them in the "reason" field';
                default:
                    return null;
            }
        },
        reasonHeader () {
            switch (this.category) {
                case 'stolenBeatmap':
                    return 'Evidence of stolen content:';
                case 'contentCaseSong':
                case 'contentCaseVisual':
                    return 'Extra information:';
                default:
                    return 'Reason for report:';
            }
        },
        reasonSubheader () {
            switch (this.category) {
                case 'stolenBeatmap':
                    return 'Link to the original map or other relevant information';
                case 'contentCaseSong':
                case 'contentCaseVisual':
                    return 'Any helpful information for anonymous voters (optional)';
                default:
                    return null;
            }
        },
        isVideoSubmission () {
            return this.videoStatus == 'isVideo';
        },
    },
    methods: {
        async submit (e) {
            if (this.category == 'contentCaseVisual' && !this.videoStatus.length) {
                return this.$store.dispatch('updateToastMessages', {
                    type: 'danger',
                    message: 'You need to specify if this is a video submission or not!',
                });
            }

            if (this.category == 'contentCaseVisual' && this.isVideoSubmission && !this.timestamps.length) {
                return this.$store.dispatch('updateToastMessages', {
                    type: 'danger',
                    message: 'You need to provide timestamps for video submissions!',
                });
            }

            const data = await this.$http.executePost(`/reports/submitReport`, {
                username: this.username,
                reason: this.reason.concat(this.timestamps.length ? `\n\n**Timestamps:**\n${this.timestamps}` : ''),
                link: this.link,
                category: this.category,
            }, e);

            if (this.$http.isValid(data)) {
                this.successInfo = 'Your report has been submitted! Its outcome will be sent to you via osu! chat';
            }
        },
    },
};
</script>
