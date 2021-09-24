<template>
    <div class="card card-body">
        Message:

        <textarea
            v-model="message"
            class="form-control form-control-sm"
            type="text"
            rows="4"
        />

        <div v-if="lines && lines.length && lines[0].length">
            Preview:
            <p
                v-for="(line, i) in lines"
                :key="i"
                class="small"
                :class="line.length > 400 ? 'text-danger' : 'text-secondary'"
            >
                <b v-if="line.length > 400">THIS LINE WILL NOT SEND</b>
                {{ line }}
            </p>
        </div>

        <hr>

        User osu! IDs (separate by new lines):

        <textarea
            v-model="users"
            class="form-control form-control-sm"
            type="text"
            rows="4"
        />

        <hr>

        <button class="btn btn-primary my-1" @click="sendMessages($event, 'list')">
            Send to users listed above
        </button>

        <button class="btn btn-primary my-1" @click="sendMessages($event, ['bn'])">
            Send to BN
        </button>

        <button class="btn btn-primary my-1" @click="sendMessages($event, ['nat'])">
            Send to NAT
        </button>

        <button class="btn btn-primary my-1" @click="sendMessages($event, ['bn', 'nat'])">
            Send to BN & NAT
        </button>

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'Spam',
    components: {
        ToastMessages,
    },
    data () {
        return {
            message: '',
            users: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        /** @returns {Array} */
        lines() {
            const lines = this.message.split('\n');

            return lines;
        },
    },
    methods: {
        async sendMessages (e, group) {
            const result = confirm(`Are you sure? This message will be sent to everyone in the ${group}.`);

            if (result) {
                const result2 = confirm(`Are you really sure? Just double-checking in case you don't read.`);

                if (result2) {
                    await this.$http.executePost(`/spam/sendMessages/`, { users: this.users, lines: this.lines, group }, e);
                }
            }
        },
    },
};
</script>