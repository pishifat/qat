<template>
    <span>
        <td scope="row" class="w-60">
            <template v-if="!editing">
                <span v-if="isNat">
                    <span v-if="hasData" :class="calculateColor">
                        ({{ event.obviousness }}/{{ event.severity }})
                    </span>
                    <a href="#" @click.prevent="editing = !editing">
                        <i class="fas fa-edit" />
                    </a>
                </span>
                <span v-html="filterLinks(event.content)" />
            </template>
            <template v-else>
                <span>
                    <span v-if="hasData" :class="calculateColor">
                        ({{ event.obviousness }}/{{ event.severity }})
                    </span>
                    <a href="#" @click.prevent="editing = !editing">
                        <i class="fas fa-edit" />
                    </a>
                    <p class="min-spacing mt-2 mb-1">Shorten the "reason" field:</p>
                </span>
                <div class="d-flex">
                    <textarea
                        v-model="newEventContent"
                        class="form-control form-control-sm dark-textarea mr-2"
                        type="text"
                        rows="4"
                        maxlength="1000"
                    />
                    <button class="btn btn-xs btn-nat align-self-center" @click="updateContent($event);">
                        Save
                    </button>
                </div>
                <obviousness-severity
                    :obviousness="event.obviousness"
                    :severity="event.severity"
                    :event-id="event._id"
                    :event-type="event.eventType"
                    @update-obviousness="$emit('update-obviousness', $event);"
                    @update-severity="$emit('update-severity', $event);"
                />
            </template>
        </td>
    </span>
</template>

<script>
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
        event: Object,
        isNat: Boolean,
    },
    data() {
        return {
            editing: false,
            newEventContent: null,
            info: null,
        };
    },
    computed: {
        hasData () {
            if ((this.event.obviousness || this.event.obviousness == 0) && (this.event.severity || this.event.severity == 0)) {
                return true;
            } else {
                return false;
            }
        },
        calculateColor () {
            let total = this.event.obviousness + this.event.severity;
            if (total >= 4 || this.event.obviousness == 2 || this.event.severity == 3) return 'vote-pass';
            else if (total >= 2) return 'vote-extend';
            else return 'vote-fail';
        },
    },
    watch: { 
        editing () {
            this.info = null;
            this.newEventContent = this.event.content;
        },
    },
    methods: {
        async updateContent (e) {
            const result = await this.executePost('/dataCollection/updateContent/' + this.event._id, { reason: this.newEventContent }, e);
            this.$emit('update-content', { id: this.event._id, type: this.event.eventType, value: result });
        },
    }
};
</script>