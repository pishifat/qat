<template>
    <td>
        <template v-if="!editing">
            <span
                v-if="loggedInUser.isNatOrTrialNat && hasData"
                :class="event.impact ? 'text-warning' : 'text-success'"
                data-toggle="tooltip"
                :title="event.impact ? 'Notable' : 'Minor'"
            >
                <i class="fas fa-exclamation-triangle" v-if="event.impact" />
                <font-awesome-icon
                    icon="fa-solid fa-circle-check"
                    class="text-success"
                    v-else
                />
            </span>
            <span v-if="loggedInUser.isNat">
                <a href="#" @click.prevent="editing = !editing">
                    <i class="fas fa-edit" />
                </a>
            </span>
            <span v-html="$md.renderInline(event.content)" />

            <div v-if="event.qaComment" class="mt-2">
                <b>QA comment:</b>
                <span v-html="$md.render(event.qaComment)" />
            </div>
        </template>

        <template v-else>
            <span
                v-if="loggedInUser.isNat && hasData"
                :class="event.impact ? 'text-warning' : 'text-success'"
                data-toggle="tooltip"
                :title="event.impact ? 'Notable' : 'Minor'"
            >
                <i class="fas fa-exclamation-triangle" v-if="event.impact" />
                <i class="fas fa-check" v-else />
            </span>
            <a href="#" @click.prevent="editing = !editing">
                <i class="fas fa-edit" />
            </a>
            <p class="mt-2 mb-1">
                Shorten the "reason" field:
            </p>
            <textarea
                v-model="newEventContent"
                class="form-control form-control-sm mr-2"
                type="text"
                rows="4"
                maxlength="1000"
            />
            <button class="btn btn-sm btn-primary btn-block mb-2" @click="updateContent($event);">
                Save
            </button>

            <hr />

            <impact
                :impact="event.impact"
                :event-id="event._id"
                :type="event.type"
            />
        </template>
    </td>
</template>

<script>
import { mapState } from 'vuex';
import Impact from '../Impact.vue';

export default {
    name: 'NominationResetEditing',
    components: {
        Impact,
    },
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
            'loggedInUser',
        ]),
        /** @returns {boolean} */
        hasData () {
            return this.event.impact !== undefined;
        },
    },
    watch: {
        editing () {
            this.newEventContent = this.event.content;
        },
    },
    methods: {
        async updateContent (e) {
            const data = await this.$http.executePost('/dataCollection/updateContent/' + this.event._id, { reason: this.newEventContent }, e);
            this.$store.commit('dataCollection/updateEvent', {
                id: this.event._id,
                type: this.event.type,
                modifiedField: 'content',
                value: data.reason,
            });
        },
    },
};
</script>
