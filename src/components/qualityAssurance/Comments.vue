<template>
    <div>
        <div class="col-sm-12 ml-2" :class="otherUserComments.length ? 'mb-1' : ''">
            <a
                href="#"
                :class="isMaxChecks || isOutdated ? 'disabled' : ''"
                @click.prevent="showInput = !showInput"
            >
                <i class="fas fa-edit" />
            </a>
            <span v-if="!showInput && !userComment">
                ...
            </span>
            <span
                v-else-if="!showInput"
                class="small text-shadow min-spacing text-white-50"
                v-html="filterLinks(userComment)"
            />
            <input
                v-if="showInput"
                v-model="userComment"
                :disabled="isMaxChecks || isOutdated"
                class="small w-90"
                type="text"
                maxlength="1000"
                placeholder="enter to submit..."
                @keyup.enter="editComment($event)"
                @change="editComment($event)"
            >
        </div>
        <div v-if="otherUserComments.length" class="col-sm-12">
            <ul class="small text-shadow mb-0">
                <!-- if not maxchecks/outdated/currentuser, show Anoynmous: comment, otherwise show username: comment -->
                <li v-for="mediation in otherUserComments" :key="mediation.id">
                    {{ isNat || isMaxChecks || isOutdated ? mediation.mediator.username + ':' : 'anonymous:' }}
                    <span v-html="filterLinks(mediation.comment)" />
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';

export default {
    name: 'Comments',
    mixins: [ postData, filterLinks ],
    props: {
        qualityAssuranceComments: {
            type: Array,
            default() {
                return [];
            },
        },
        eventId: {
            type: String,
            required: true,
        },
        isMaxChecks: Boolean,
        isOutdated: Boolean,
    },
    data() {
        return {
            showInput: false,
            userComment: null,
            mediationId: null,
        };
    },
    computed: {
        ...mapState([
            'userId',
            'isNat',
        ]),
        otherUserComments() {
            return this.qualityAssuranceComments.filter(m => m.mediator.id != this.userId && m.comment.length);
        },
    },
    watch: {
        qualityAssuranceComments() {
            this.findRelevantComment();
        },
    },
    mounted() {
        this.findRelevantComment();
    },
    methods: {
        findRelevantComment() {
            this.userComment = null;
            this.mediationId = null;

            const userMediation = this.qualityAssuranceComments.find(m => m.mediator.id == this.userId);

            if (userMediation) {
                this.userComment = userMediation.comment;
                this.mediationId = userMediation.id;
            }
        },
        async editComment (e) {
            this.showInput = false;
            const event = await this.executePost('/qualityAssurance/editComment/' + this.eventId, { mediationId: this.mediationId, comment: this.userComment }, e);

            if (event && !event.error) {
                this.$store.commit('updateEvent', event);
                this.findRelevantComment();
            }
        },
    },
};
</script>

<style scoped>
    .w-90 {
        width: 90%;
    }

    .max-height-20-px {
        max-height: 20px;
    }

    a.disabled {
        pointer-events: none;
        cursor: default;
    }

</style>