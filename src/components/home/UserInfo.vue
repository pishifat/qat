<template>
    <modal-dialog id="userInfo">
        <template v-if="selectedUser" #header>
            <modal-header />
        </template>

        <div v-if="selectedUser">
            <div class="mx-3">
                <b>Status:</b>
                    <span
                        class="badge badge-pill mx-1 text-lowercase"
                        :class="getStatus(selectedUser.requestStatus) === 'closed' ? 'badge-danger' : getStatus(selectedUser.requestStatus) === 'open' ? 'badge-success' : 'badge-secondary'"
                    >
                        {{ getStatus(selectedUser.requestStatus) }}
                    </span>
            </div>
            <div class="mx-3">
                <b>Request methods:</b>
                    <span
                        v-for="method in requestMethods(selectedUser.requestStatus)"
                        :key="method"
                        class="badge badge-pill mx-1 text-lowercase"
                        :class="method === 'unknown' ? 'badge-secondary' : 'badge-primary'"
                        v-html="$md.renderInline(formatLink(method, selectedUser.requestLink, selectedUser.osuId))"
                    />
            </div>
            <div v-if="selectedUser.languages.length" class="mx-3">
                <b>Languages:</b>
                    <span
                        v-for="language in selectedUser.languages"
                        :key="language"
                        class="language-tag badge badge-pill mx-1 text-lowercase badge-secondary"
                        v-html="language"
                    />
            </div>

            <hr />

            <div class="mx-3">
                <div>
                    <b>Request information:</b>
                    <a
                        v-if="loggedInUser && loggedInUser._id === selectedUser.id && !isEditing"
                        href="#"
                        class="ml-1"
                        @click.prevent="isEditing = !isEditing"
                    >
                        <i class="fas fa-edit" />
                    </a>
                </div>
                <div v-if="isEditing">
                    <textarea
                        v-model="requestInfo"
                        class="form-control form-control-sm my-2"
                        type="text"
                        rows="4"
                        placeholder="BN requests info (markdown is supported!)"
                    />
                    
                    <button type="submit" class="btn btn-sm btn-secondary" @click="updateRequestInfo($event)">
                        Update
                    </button>
                    <button type="submit" class="btn btn-sm btn-primary mx-2" @click="isEditing = !isEditing">
                        Cancel
                    </button>
                </div>
                <div v-else>
                    <div v-if="selectedUser.requestInfo" class="card card-body small my-2">
                        <span v-html="$md.render(selectedUser.requestInfo)" />
                    </div>
                    <span v-else class="small text-secondary">None...</span>
                </div>
            </div>

            <hr />

            <preferences />

            <div v-if="loggedInUser && loggedInUser.isPishifat">
                <hr />
                <div class="ml-3">
                    <b>Debug</b>
                    <div class="ml-3">
                        <a href="#userDocument" data-toggle="collapse">
                            view user document <i class="fas fa-angle-down" />
                        </a>
                        <pre id="userDocument" class="collapse container text-white">{{ JSON.stringify(selectedUser, null, 4) }}</pre>
                    </div>
                </div>
            </div>
        </div>

    </modal-dialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import ModalHeader from './ModalHeader.vue';
import ModalDialog from '../ModalDialog.vue';
import Preferences from './info/Preferences.vue';
import evaluations from '../../mixins/evaluations';

export default {
    name: 'UserInfo',
    components: {
        ModalHeader,
        ModalDialog,
        Preferences,
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('usersHome', [
            'selectedUser',
        ]),
    },
    data () {
        return {
            isEditing: false,
            requestInfo: '',
        };
    },
   watch: {
        selectedUser() {
            this.requestInfo = this.selectedUser.requestInfo;
        },
    },
    mounted() {
        this.requestInfo = this.selectedUser.requestInfo;
    },
    mixins: [ evaluations ],
    methods: {
        async updateRequestInfo(e) {
            e.preventDefault();

            const res = await this.$http.executePost(`/users/${this.selectedUser.id}/updateRequestInfo`, { requestInfo: this.requestInfo }, e);

            if (this.$http.isValid(res)) {
                let user = this.selectedUser;
                user.requestInfo = res.user.requestInfo;
                this.$store.commit('usersHome/updateUser', user);
                this.isEditing = false;
            }
        },
        /** @returns {array} */
        requestMethods(requestStatus) {
            let statusList = [...requestStatus];

            statusList = statusList.sort().filter(status => status !== 'closed');

            if (!statusList.length) return ['unknown'];

            return statusList;
        },
        /** @returns {string} */
        getStatus(requestStatus) {
            if (!requestStatus || !requestStatus.length) return 'unknown';

            if (requestStatus.includes('closed')) {
                return 'closed';
            } else 
                return 'open';
        },
        /** @returns {string} */
        formatLink(status, requestLink, osuId) {
            if (status === 'unknown') return 'unknown';

            status = this.makeWordFromField(status);

            if (status === 'Personal Queue' && requestLink) {
                return `[mod queue](${requestLink})`;
            } else if (status === 'Personal Queue') {
                return `mod queue`;
            }
            
            if (status === 'Game Chat') {
                return `[chat](https://osu.ppy.sh/community/chat?sendto=${osuId})`;
            }

            return status;
        },
    }
};
</script>
