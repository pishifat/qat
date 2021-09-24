<template>
    <div>
        <div class="card card-body small mb-2">
            <span v-for="(message, i) in messages" :key="i" v-html="$md.render(message)" />
        </div>

        <a v-if="users.length" class="btn btn-sm btn-block btn-success mb-2" @click="sendMessages($event)">
            Send messages & archive
        </a>
    </div>
</template>

<script>

export default {
    name: 'BotChatMessage',
    props: {
        messages: {
            type: Array,
            default() {
                return [];
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
    },
    methods: {
        async sendMessages (e) {
            const result = confirm(`Are you sure? This will take a few seconds to complete.`);
            const mongoId = this.mongoId;

            if (result) {
                let route = '';

                switch (this.messageType) {
                    case 'veto':
                        route = 'vetoes';
                        break;
                    case 'report':
                        route = 'manageReports';
                        break;
                    case 'eval':
                        if (this.evalType == 'application') {
                            route = 'appEval';
                        } else if (this.evalType == 'currentBn' || this.evalType == 'resignation') {
                            route = 'bnEval';
                        }

                        break;
                    default:
                        return '';
                }

                const res = await this.$http.executePost(`/${route}/sendMessages/${mongoId}`, { users: this.users, messages: this.messages }, e);

                if (this.messageType == 'eval' && res.success) {
                    await this.$http.executePost(`/${route}/setComplete/`, { evalIds: [mongoId] });
                    this.$router.push(`evalarchive?id=${mongoId}`);
                }
            }
        },
    },
};
</script>

<style>
</style>
