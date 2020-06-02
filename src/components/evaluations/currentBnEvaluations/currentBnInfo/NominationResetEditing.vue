<template>
    <td>
        <template v-if="!editing">
            <span v-if="hasData" :class="calculateColor">
                ({{ event.obviousness }}/{{ event.severity }})
            </span>
            <span v-if="isNat">
                <a href="#" @click.prevent="editing = !editing">
                    <i class="fas fa-edit" />
                </a>
            </span>
            <span v-html="filterLinks(event.content)" />

            <div v-if="event.userQualityAssuranceComment && isNat" class="mt-2">
                <span class="font-weight-bold">QA comment:</span>
                <span v-html="filterLinks(event.userQualityAssuranceComment)" />
            </div>
        </template>

        <template v-else>
            <span>
                <span v-if="hasData" :class="calculateColor">
                    ({{ event.obviousness }}/{{ event.severity }})
                </span>
                <a href="#" @click.prevent="editing = !editing">
                    <i class="fas fa-edit" />
                </a>
                <p class="mt-2 mb-1">Shorten the "reason" field:</p>
            </span>
            <textarea
                v-model="newEventContent"
                class="form-control form-control-sm mr-2"
                type="text"
                rows="4"
                maxlength="1000"
            />
            <button class="btn btn-sm btn-nat btn-block mb-2" @click="updateContent($event);">
                Save
            </button>

            <obviousness-severity
                :obviousness="event.obviousness"
                :severity="event.severity"
                :event-id="event._id"
                :event-type="event.eventType"
            />
        </template>
    </td>
</template>

<script>
import { mapState } from 'vuex';
import postData from '../../../../mixins/postData.js';
import filterLinks from '../../../../mixins/filterLinks.js';
import ObviousnessSeverity from './ObviousnessSeverity.vue';

export default {
    name: 'NominationResetEditing',
    components: {
        ObviousnessSeverity,
    },
    mixins: [ postData, filterLinks ],
    props: {
        event: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            editing: false,
            newEventContent: null,
        };
    },
    computed: {
        ...mapState([
            'isNat',
        ]),
        hasData () {
            if ((this.event.obviousness || this.event.obviousness == 0) && (this.event.severity || this.event.severity == 0)) {
                return true;
            } else {
                return false;
            }
        },
        calculateColor () {
            let total = this.event.obviousness + this.event.severity;
            if (total >= 4 || this.event.obviousness == 2 || this.event.severity == 3) return 'text-success';
            else if (total >= 2) return 'text-neutral';
            else return 'text-danger';
        },
    },
    watch: {
        editing () {
            this.newEventContent = this.event.content;
        },
    },
    methods: {
        async updateContent (e) {
            const result = await this.executePost('/dataCollection/updateContent/' + this.event._id, { reason: this.newEventContent }, e);
            this.$store.commit('updateEvent', {
                id: this.event._id,
                type: this.event.eventType,
                modifiedField: 'content',
                value: result,
            });
            this.$store.dispatch('updateToastMessages', {
                message: `Updated content`,
                type: 'success',
            });
        },
    },
};
</script>