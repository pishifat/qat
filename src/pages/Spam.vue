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

        <div class="row mx-2 my-2">
            <button class="btn btn-primary my-1 col-sm-5 mx-2" @click="findUserOsuIds($event)">
                Find user IDs
            </button>

            <select
                v-model="group"
                class="form-control my-1 mx-1 col-sm-3"
            >
                <option value="" disabled>
                    Select a group
                </option>
                <option value="bn">
                    BN
                </option>
                <option value="nat">
                    NAT
                </option>
                <option value="all">
                    all
                </option>
            </select>

            <select
                v-model="mode"
                class="form-control my-1 mx-1 col-sm-3"
            >
                <option value="" disabled>
                    Select a mode
                </option>
                <option value="osu">
                    osu
                </option>
                <option value="taiko">
                    taiko
                </option>
                <option value="catch">
                    catch
                </option>
                <option value="mania">
                    mania
                </option>
                <option value="all">
                    all
                </option>
            </select>
        </div>



        <hr>


        <button class="btn btn-danger my-1" @click="sendMessages($event)">
            Send to users listed above
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
            group: '',
            mode: '',
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
        async sendMessages (e) {
            const result = confirm(`Are you sure? This message will be sent to everyone listed.`);

            if (result) {
                const result2 = confirm(`Are you really sure? Just double-checking in case you don't read.`);

                if (result2) {
                    await this.$http.executePost(`/spam/sendMessages/`, { users: this.users, lines: this.lines }, e);
                }
            }
        },
        async findUserOsuIds (e) {
            if (!this.group || !this.mode) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave fields blank!`,
                    type: 'danger',
                });
            } else {
                const res = await this.$http.executeGet(`/spam/findUserOsuIds/${this.group}/${this.mode}`, e);

                for (const id of res) {
                    if (!this.users.length) {
                        this.users += id;
                    } else {
                        this.users += '\n' + id;
                    }
                }

                this.$store.dispatch('updateToastMessages', {
                    message: `Added ${res.length} users`,
                    type: 'success',
                });
            }
        },
    },
};
</script>