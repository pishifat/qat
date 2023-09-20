<template>
    <div class="card card-body">
        <div class="card card-body small mb-4">
            <h4>Announcement (home page and BN server)</h4>
            <div class="text-secondary mb-2">This sends a message to the #announcements channel in the BN Discord server and displays the announcement on the front page of this website.</div>
            <div>
                Roles:
                <select
                    v-model="selectedRole"
                    class="form-control form-control-sm my-1 mx-1 col-sm-3"
                >
                    <option value="" disabled>
                        Select a role
                    </option>
                    <option value="nat">
                        NAT
                    </option>
                    <option value="bn">
                        BN
                    </option>
                    <option value="probation">
                        Probation
                    </option>
                    <option value="bnOsu">
                        BN (osu!)
                    </option>
                    <option value="bnTaiko">
                        BN (osu!taiko)
                    </option>
                    <option value="bnCatch">
                        BN (osu!catch)
                    </option>
                    <option value="bnMania">
                        BN (osu!mania)
                    </option>
                    <option value="probationOsu">
                        Probation (osu!)
                    </option>
                    <option value="probationTaiko">
                        Probation (osu!taiko)
                    </option>
                    <option value="probationCatch">
                        Probation (osu!catch)
                    </option>
                    <option value="probationMania">
                        Probation (osu!mania)
                    </option>
                </select>
                <button class="btn btn-secondary btn-sm my-1 col-sm-3 mx-2" @click="toggleRole()">
                    {{ roles.includes(selectedRole) ? 'Remove selected role' : 'Add selected role' }}
                </button>
                <div v-if="this.roles && this.roles.length" class="small text-secondary">
                    Selected roles: {{ roles }}
                </div>
            </div>

            <div>
                Title:
                <input
                    v-model="title"
                    class="form-control mb-2"
                    type="text"
                />
            </div>
            
            <div>
                Message:

                <textarea
                    v-model="announcement"
                    class="form-control form-control-sm"
                    type="text"
                    rows="4"
                />
            </div>

            <div v-if="title.length && announcement.length" 
                data-toggle="tooltip"
                data-placement="left"
                title="embed links/images won't work in Discord, but they WILL work on the front page">
                Preview:
                <div
                    class="pre-line"
                    :class="announcement.length > 4096 ? 'text-danger' : 'text-secondary'"
                >
                    <b v-for="role in roles" :key="role">@{{ role }} </b>
                    <b>{{ title }}</b>
                    <span class="small" v-html="$md.render(announcement)"></span>
                </div>
                <b v-if="announcement.length > 4096">TOO MANY CHARACTERS FOR DISCORD. shorten message pls</b>
            </div>

            <button v-if="announcement.length" class="btn btn-danger my-1" @click="sendAnnouncement($event)">
                Publish announcement
            </button>
        </div>

        <div class="card card-body small mb-4">
            <h4>Message (mappersguild bot)</h4>
            <div class="text-secondary mb-2">You don't have permission to use this. If you think you should, talk to pishifat.</div>
            <div>
                Message:

                <textarea
                    v-model="message"
                    class="form-control form-control-sm"
                    type="text"
                    rows="4"
                />
            </div>

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

            <div class="row mx-2 my-2 s">
                <button class="btn btn-secondary btn-sm my-1 col-sm-5 mx-2" @click="findUserOsuIds($event)">
                    Load user IDs
                </button>

                <select
                    v-model="group"
                    class="form-control form-control-sm my-1 mx-1 col-sm-3"
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
                    class="form-control form-control-sm my-1 mx-1 col-sm-3"
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

            <button v-if="message.length" class="btn btn-danger my-1" @click="sendMessages($event)">
                Send message(s) to user(s) listed above
            </button>
        </div>
        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'Spam',
    // @ts-ignore
    metaInfo: {
        meta: [
            { property: 'og:title', content: 'Spam · NAT/BN Management' },
            { property: 'og:description', content: 'The place for everything related to the Beatmap Nominators!' },
        ],
    },
    components: {
        ToastMessages,
    },
    data () {
        return {
            announcement: '',
            title: '',
            selectedRole: '',
            roles: [],
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
        toggleRole () {
            if (!this.selectedRole.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Must select a role!`,
                    type: 'danger',
                });
            } else {
                if (this.roles.includes(this.selectedRole)) {
                    const i = this.roles.findIndex(r => r === this.selectedRole);
                    this.roles.splice(i, 1);
                } else {
                    this.roles.push(this.selectedRole);
                }
            }
        },
        async sendMessages (e) {
            const result = confirm(`Are you sure? This message will be sent to a lot of people.`);

            if (result) {
                const result2 = confirm(`Are you really sure? Just double-checking in case you don't read.`);

                if (result2) {
                    await this.$http.executePost(`/spam/sendMessages/`, { users: this.users, lines: this.lines }, e);
                }
            }
        },
        async sendAnnouncement (e) {
            const result = confirm(`Are you sure? This message will be sent to a lot of people.`);

            if (result) {
                const result2 = confirm(`Are you really sure? Just double-checking in case you don't read.`);

                if (result2) {
                    await this.$http.executePost(`/spam/sendAnnouncement/`, { announcement: this.announcement, title: this.title, roles: this.roles }, e);
                }
            }
        },
    },
};
</script>