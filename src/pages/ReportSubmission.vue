<template>
    <div>
        <section class="card card-body mb-3">
            <p>Reports can be made about anything mapping/modding related, including but not limited to:</p>
            <ul>
                <li>Stolen beatmaps</li>
                <li>Beatmaps breaking song content rules</li>
                <li>Inappropriate behavior on a map discussion page/beatmap comment</li>
                <li>A member of the BN/NAT violating the Code of Conduct/BN Rules</li>
            </ul>
            <p>Authors of reports are anonymous until a consensus is met. The consensus will then be relayed to you via osu! chat.</p>
        </section>

        <section class="card card-body">
            <div class="row mb-2">
                <div class="col-sm-12">
                    <h4>Relevant beatmap/discussion post:</h4>
                    <p class="small text-secondary">
                        If multiple links need mentioning, include them in the reason field below.
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

            <div class="row mb-2">
                <div class="col-sm-12">
                    <h4>Username:</h4>
                    <p class="small text-secondary">
                        If your report pertains to a member of the BN/NAT, include their name.
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
                    <h4>Reason for report:</h4>
                    <p class="small text-secondary">
                        Try to include evidence, such as a link to a beatmap discussion or a screenshot.
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
        };
    },
    methods: {
        async submit (e) {
            const data = await this.executePost(`/reports/submitReport`, {
                username: this.username,
                reason: this.reason,
                link: this.link,
            }, e);

            if (!data.error) {
                this.$store.dispatch('updateToastMessages', {
                    message: 'Sent!',
                    type: 'success',
                });

                this.successInfo = 'Your report has been submitted! Its outcome will be sent to you via osu! chat';
            }
        },
    },
};
</script>
