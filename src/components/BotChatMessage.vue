<template>
    <div>
        <div class="card card-body small mb-2">
            <span v-html="$md.render(message)" />
        </div>

        <a v-if="users.length && !isReviewable || isReviewed" class="btn btn-sm btn-block btn-success mb-2" @click="sendMessage($event)">
            {{ customText }}
        </a>
        <div v-if="isReviewable && !isReviewed" class="alert alert-primary mb-2 mt-2">
                <i class="fas fa-exclamation-triangle"></i>
                Feedback needs to be marked as reviewed before sending!
            </div>
    </div>
</template>

<script>

export default {
    name: 'BotChatMessage',
    props: {
        message: {
            type: String,
            default() {
                return "you shouldn't be seeing this, contact pishifat ASAP";
            },
            required: true,
        },
        messageType: {
            type: String,
            required: true,
        },
        mongoId: {
            type: String,
            required: true,
        },
        users: {
            type: Array,
            default() {
                return [];
            },
        },
        evalType: {
            type: String,
            default: '',
        },
        customText: {
            type: String,
            default: 'Send messages',
        },
        isReviewable: {
            type: Boolean,
            default: false,
        },
        isReviewed: {
            type: Boolean,
            default: true,
        },
    },
    methods: {
        async sendMessage (e) {
            const result = confirm(`Are you sure? This will take a few seconds to complete.`);
            const mongoId = this.mongoId;

            if (result) {
                let route = '';
                let type = '';

                switch (this.messageType) {
                    case 'veto':
                        route = 'vetoes';
                        break;
                    case 'report':
                        route = 'manageReports';
                        break;
                    case 'enableBnEvaluators':
                        route = 'appEval';
                        type = 'enable mock evaluations';
                        break;
                    case 'eval':
                        if (this.evalType == 'application') {
                            route = 'appEval';
                        } else if (this.evalType == 'currentBn' || this.evalType == 'resignation') {
                            route = 'bnEval';
                        }

                        type = 'archive';

                        break;
                    default:
                        return '';
                }

                const res = await this.$http.executePost(`/${route}/sendMessages/${mongoId}`, { users: this.users, message: this.message, type }, e);

                if (this.messageType == 'eval' && res.success) {
                    await this.$http.executePost(`/${route}/setComplete/`, { evalIds: [mongoId] });
                    $('#evaluationInfo').modal('hide');
                    this.$router.push(`evalarchive?id=${mongoId}`);
                }

                if (this.messageType == 'enableBnEvaluators') {
                    await this.$http.executePost(`/${route}/enableBnEvaluators/${mongoId}`, { bnEvaluators: this.users });
                    window.location.reload();
                }
            }
        },
    },
};
</script>

<style>
</style>
