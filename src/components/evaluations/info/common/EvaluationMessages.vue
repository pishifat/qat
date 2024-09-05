<template>
    <div v-if="isNewEvaluationFormat">
        <div v-if="evaluation.messages && evaluation.messages.length">
            <h5>Messages</h5>
            <p v-if="isMessagePage">
                The outcome of your evaluation is final.
                <span v-if="!evaluation.messagesLocked">If you have questions, reply below!</span>
            </p>
        </div>
        <div
            v-for="(message, i) in evaluation.messages"
            :key="i"
            class="card card-body mb-2"
            :class="`card-bg-${message.isNat ? 'nat' : evaluation.isApplication ? 'user' : 'bn'}`">
            <div>
                <b>{{ new Date(message.date).toLocaleDateString() }}</b>
            </div>
            <div v-html="$md.render(message.content)" />
        </div>

        <div
            v-if="
                (loggedInUser.id == evaluation.user.id && !evaluation.messagesLocked) ||
                loggedInUser.isNat
            ">
            <div v-if="replies" class="card card-body">
                <textarea
                    id="messageInput"
                    v-model="messageInput"
                    class="form-control"
                    maxlength="1000"
                    :placeholder="
                        evaluation.messagesLocked
                            ? 'messages are disabled.'
                            : evaluation.messages && evaluation.messages.length > 1
                            ? 'type a reply...'
                            : 'type a question about your evaluation...'
                    "
                    rows="2"
                    :disabled="evaluation.messagesLocked"
                />
                <b v-if="messageInput && messageInput.length > 900" :class="messageInput.length == 1000 ? 'text-danger' : messageInput.length > 900 ? 'text-warning' : 'text-secondary'">{{ messageInput.length }}</b>
                <div class="row">
                    <div :class="loggedInUser.isNat ? 'col-sm-8' : 'col-sm-12'">
                        <button
                            class="btn btn-primary btn-block btn-sm mt-1"
                            @click="saveMessage($event)"
                            :disabled="evaluation.messagesLocked">
                            Send message
                        </button>
                    </div>
                    <div v-if="loggedInUser.isNat" class="col-sm-4">
                        <button
                            class="btn btn-danger btn-block btn-sm mt-1"
                            @click="toggleMessagesLocked($event)">
                            {{ evaluation.messagesLocked ? "Unlock" : "Lock" }} messages
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'EvaluationMessages',
    props: {
        evaluation: {
            type: Object,
            required: true,
        },
        isNewEvaluationFormat: {
            type: Boolean,
        },
        replies: {
            type: Boolean,
            default: false,
        },
        isMessagePage: {
            type: Boolean,
            default: false,
        },
    },
    data () {
        return {
            messageInput: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    methods: {
        async saveMessage (e) {
            const messages = await this.$http.executePost('/message/submitEvaluationMessage/' + this.evaluation.id, { message: this.messageInput }, e);

            if (this.$http.isValid(messages)) {
                this.$store.commit('message/updateEvaluationMessages', messages);
                this.messageInput = '';
                this.$store.dispatch('updateToastMessages', {
                    message: 'Message sent',
                    type: 'success',
                });
            }
        },
        async toggleMessagesLocked (e) {
            const locked = await this.$http.executePost('/message/toggleMessagesLocked/' + this.evaluation.id, {}, e);

            if (this.$http.isValid(locked)) {
                this.$store.commit('message/toggleEvaluationMessagesLocked');
                this.$store.dispatch('updateToastMessages', {
                    message: this.evaluation.messagesLocked ? 'Locked' : 'Unlocked',
                    type: 'success',
                });
            }
        },
    },
};
</script>

<style scoped>
.card-bg-nat {
    background-image: url('~/public/images/nat.png');
    background-repeat: repeat-y;
    background-position: left;
}
.card-bg-user {
    background-image: url('~/public/images/user.png');
    background-repeat: repeat-y;
    background-position: left;
}
.card-bg-bn {
    background-image: url('~/public/images/bn.png');
    background-repeat: repeat-y;
    background-position: left;
}
</style>
