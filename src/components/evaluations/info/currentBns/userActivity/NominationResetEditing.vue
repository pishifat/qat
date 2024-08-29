<template>
    <td>
        <template v-if="!editing">
            <span
                v-if="loggedInUser && loggedInUser.isNatOrTrialNat && hasData"
                :class="getImpact(event.impactNum).color"
                data-toggle="tooltip"
                :title="getImpact(event.impactNum).text"
            >
                <i v-if="event.impactNum !== 0" :class="getImpact(event.impactNum).icon" />
                <font-awesome-icon v-else :icon="getImpact(event.impactNum).icon" />
            </span>
            <span v-if="loggedInUser && loggedInUser.isNat">
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
                v-if="loggedInUser && loggedInUser.isNat && hasData"
                :class="getImpact(event.impactNum).color"
                data-toggle="tooltip"
                :title="getImpact(event.impactNum).text"
            >
                <i v-if="event.impactNum !== 0" :class="getImpact(event.impactNum).icon" />
                <font-awesome-icon v-else :icon="getImpact(event.impactNum).icon" />
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
                :impact="event.impactNum"
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
            return this.event.impactNum !== undefined;
        },
    },
    watch: {
        editing () {
            this.newEventContent = this.event.content;
        },
    },
    methods: {
        getImpact(impact) {
            switch (impact) {
                case 2:
                    return { color: 'text-danger', icon: 'fas fa-times-circle', text: 'Severe' };
                case 1:
                    return { color: 'text-warning', icon: 'fas fa-exclamation-circle', text: 'Notable' };
                case 0:
                    return { color: 'text-success', icon: 'fa-solid fa-circle-check', text: 'Minor' };
                default:
                    return;
            }
        },
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
