<template>
    <div>
        <div v-if="isQualityAssuranceChecker" class="col-sm-12 my-2" :class="otherChecksWithComments.length ? 'mb-1' : ''">
            <a
                href="#"
                class="ml-2"
                :class="disable ? 'disabled' : ''"
                @click.prevent="showInput = !showInput"
            >
                <i class="fas fa-edit" />
            </a>
            <span v-if="!showInput && !userComment">
                ... <span class="small">(write any notes about your QA check here!)</span>
            </span>
            <span
                v-else-if="!showInput"
                class="ml-1 text-white"
                v-html="$md.renderInline(userComment)"
            />
            <input
                v-if="showInput"
                v-model="userComment"
                :disabled="disable"
                class="form-control form-control-sm ml-2 w-75"
                type="text"
                maxlength="1000"
                placeholder="enter to submit..."
                @keyup.enter="editComment($event)"
                @change="editComment($event)"
            >
        </div>

        <div v-if="otherChecksWithComments.length" class="col-sm-12 mb-2">
            <ul class="mb-0">
                <!-- if not maxchecks/outdated/currentuser, show Anoynmous: comment, otherwise show username: comment -->
                <li v-for="check in otherChecksWithComments" :key="check.id">
                    {{ loggedInUser.isNat || disable ? check.user.username + ':' : 'anonymous:' }}
                    <span v-html="$md.renderInline(check.comment)" />
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../../mixins/postData.js';

export default {
    name: 'Comments',
    mixins: [ postData ],
    props: {
        qualityAssuranceChecks: {
            type: [Array, Object],
            default() {
                return [];
            },
        },
        eventId: {
            type: String,
            required: true,
        },
        isQualityAssuranceChecker: Boolean,
        disable: Boolean,
    },
    data() {
        return {
            showInput: false,
            userComment: null,
            qaCheckId: null,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapState('qualityAssurance', [
            'pageFilters',
        ]),
        otherChecksWithComments() {
            return this.qualityAssuranceChecks.filter(q => q.user.id != this.loggedInUser.id && q.comment && q.comment.length);
        },
    },
    watch: {
        event() {
            this.findRelevantComment();
        },
    },
    mounted() {
        this.findRelevantComment();
    },
    methods: {
        findRelevantComment() {
            this.userComment = null;
            this.qaCheckId = null;

            const userMediation = this.qualityAssuranceChecks.find(q => q.user.id == this.loggedInUser.id && q.mode == this.pageFilters.filters.mode);

            if (userMediation) {
                this.userComment = userMediation.comment;
                this.qaCheckId = userMediation.id;
            }
        },
        async editComment (e) {
            this.showInput = false;
            const qaCheck = await this.executePost('/qualityAssurance/editComment/' + this.eventId, { qaCheckId: this.qaCheckId, comment: this.userComment }, e);

            if (event && !event.error) {
                this.$store.commit('qualityAssurance/updateQaCheck', this.eventId, qaCheck);
                this.findRelevantComment();
            }
        },
    },
};
</script>
