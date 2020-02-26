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
                    <button class="btn btn-xs btn-nat align-self-center" @click="updateReason($event);">
                        Save
                    </button>
                </div>
                <p class="min-spacing mt-2">Obviousness:</p>
                <ul>
                    <li>
                        <a href="#" :class="event.obviousness == 0 ? 'errors' : ''" @click.prevent="updateObviousness(0)">
                            0: Not obvious
                        </a>
                    </li>
                    <li>
                        <a href="#" :class="event.obviousness == 1 ? 'errors' : ''" @click.prevent="updateObviousness(1)">
                            1: Can be found with experience
                        </a>
                    </li>
                    <li>
                        <a href="#" :class="event.obviousness == 2 ? 'errors' : ''" @click.prevent="updateObviousness(2)">
                            2: Can be found at a glance
                        </a>
                    </li>
                </ul>
                <p class="min-spacing mt-2">Severity:</p>
                <ul>
                    <li>
                        <a href="#" :class="event.severity == 0 ? 'errors' : ''" @click.prevent="updateSeverity(0)">
                            0: Not severe
                        </a>
                    </li>
                    <li>
                        <a href="#" :class="event.severity == 1 ? 'errors' : ''" @click.prevent="updateSeverity(1)">
                            1: Slightly detrimental to gameplay
                        </a>
                    </li>
                    <li>
                        <a href="#" :class="event.severity == 2 ? 'errors' : ''" @click.prevent="updateSeverity(2)">
                            2: Noticably detrimental to gameplay
                        </a>
                    </li>
                    <li>
                        <a href="#" :class="event.severity == 3 ? 'errors' : ''" @click.prevent="updateSeverity(3)">
                            3: More or less unplayable
                        </a>
                    </li>
                </ul>
                <p v-if="info" class="errors">
                    {{ info }}
                </p>
            </template>
        </td>
    </span>
</template>

<script>
import postData from '../../../../mixins/postData.js';
import filterLinks from '../../../../mixins/filterLinks.js';

export default {
    name: 'NominationResetEditing',
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
        hasData() {
            if ((this.event.obviousness || this.event.obviousness == 0) && (this.event.severity || this.event.severity == 0)) {
                return true;
            } else {
                return false;
            }
        },
        calculateColor() {
            let total = this.event.obviousness + this.event.severity;
            if (total >= 4 || this.event.obviousness == 2 || this.event.severity == 3) return 'vote-pass';
            else if (total >= 2) return 'vote-extend';
            else return 'vote-fail';
        },
    },
    watch: { 
        editing() {
            this.info = null;
            this.newEventContent = this.event.content;
        },
    },
    methods: {
        async updateReason(e) {
            const result = await this.executePost('/dataCollection/updateReason/' + this.event._id, { reason: this.newEventContent }, e);
            if (result) {
                if (result.error) {
                    this.info = result.error;
                } else {
                    this.$emit('update-entry', result);
                }
            }
        },
        async updateObviousness(obviousness) {
            const result = await this.executePost('/dataCollection/updateObviousness/' + this.event._id, { obviousness });
            if (result) {
                if (result.error) {
                    this.info = result.error;
                } else {
                    this.$emit('update-entry', result);
                }
            }
        },
        async updateSeverity(severity) {
            const result = await this.executePost('/dataCollection/updateSeverity/' + this.event._id, { severity });
            if (result) {
                if (result.error) {
                    this.info = result.error;
                } else {
                    this.$emit('update-entry', result);
                }
            }
        },
    },
};
</script>
