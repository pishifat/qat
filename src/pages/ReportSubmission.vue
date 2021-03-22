<template>
    <div>
        <section class="card card-body mb-3">
            <p>Reports can be made about anything mapping/modding related, including but not limited to:</p>
            <ul>
                <li>Stolen beatmaps</li>
                <li>Beatmap songs violating osu!'s <a href="https://osu.ppy.sh/wiki/en/Rules/Song_Content_Rules" target="_blank">Song Content Rules</a></li>
                <li>Beatmap backgrounds (or other visual assets) violating osu!'s <a href="https://osu.ppy.sh/wiki/Rules/Visual_Content_Considerations" target="_blank">Visual Content Considerations</a></li>
                <li>Inappropriate behavior on a beatmap discussion or comments</li>
                <li>A member of the BN/NAT violating osu!'s <a href="https://osu.ppy.sh/wiki/Rules/Code_of_Conduct_for_Modding_and_Mapping" target="_blank">Code of Conduct</a>, <a href="https://osu.ppy.sh/wiki/People/The_Team/Beatmap_Nominators/Rules" target="_blank">BN Rules</a>, or <a href="https://osu.ppy.sh/wiki/People/The_Team/Beatmap_Nominators/Expectations" target="_blank">Expectations for the BN</a></li>
            </ul>
            <p>Most reports are evaluated by the NAT on a case-by-case basis. In special cases, members of the BN/GMT/NAT evaluate inappropriate content through anonymous votes.</p>
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
                        <option value="stolenBeatmap">
                            Stolen beatmap
                        </option>
                        <option value="contentCaseSong">
                            Song Content Rules violation
                        </option>
                        <option value="contentCaseVisual">
                            Visual Content Considerations violation
                        </option>
                        <option value="behavior">
                            Inappropriate behavior in beatmap discussion or comments
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
                        <b>Note:</b> Content in ranked maps will not be changed unless it is severely inappropriate. Please focus reports on inappropriate content from qualified/pending/WIP/graveyard maps.
                    </div>
                </div>

                <hr>

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
                            If your report pertains to a member of the BN/NAT, include their name. Otherwise leave empty.
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
        </section>

        <toast-messages />
    </div>
</template>

<script>
import postData from '../mixins/postData';
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'ReportSubmission',
    components: {
        ToastMessages,
    },
    mixins: [ postData ],
    data () {
        return {
            username: '',
            reason: '',
            link: '',
            successInfo: '',
            category: '',
        };
    },
    computed: {
        primaryLinkHeader () {
            switch (this.category) {
                case 'stolenBeatmap':
                    return 'Link to stolen beatmap:';
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
    },
    methods: {
        async submit (e) {
            const data = await this.executePost(`/reports/submitReport`, {
                username: this.username,
                reason: this.reason,
                link: this.link,
                category: this.category,
            }, e);

            if (data && !data.error) {
                this.successInfo = 'Your report has been submitted! Its outcome will be sent to you via osu! chat';
            }
        },
    },
};
</script>
