<template>
    <div>
        <p class="min-spacing mt-2">
            Obviousness:
        </p>
        <ul>
            <li>
                <a href="#" :class="obviousness == 0 ? 'errors' : ''" @click.prevent="updateObviousness(0)">
                    0: Not obvious
                </a>
            </li>
            <li>
                <a href="#" :class="obviousness == 1 ? 'errors' : ''" @click.prevent="updateObviousness(1)">
                    1: Can be found with experience
                </a>
            </li>
            <li>
                <a href="#" :class="obviousness == 2 ? 'errors' : ''" @click.prevent="updateObviousness(2)">
                    2: Can be found at a glance
                </a>
            </li>
        </ul>
        <p class="min-spacing mt-2">
            Severity:
        </p>
        <ul>
            <li>
                <a href="#" :class="severity == 0 ? 'errors' : ''" @click.prevent="updateSeverity(0)">
                    0: Not severe
                </a>
            </li>
            <li>
                <a href="#" :class="severity == 1 ? 'errors' : ''" @click.prevent="updateSeverity(1)">
                    1: Slightly detrimental to gameplay
                </a>
            </li>
            <li>
                <a href="#" :class="severity == 2 ? 'errors' : ''" @click.prevent="updateSeverity(2)">
                    2: Noticably detrimental to gameplay
                </a>
            </li>
            <li>
                <a href="#" :class="severity == 3 ? 'errors' : ''" @click.prevent="updateSeverity(3)">
                    3: More or less unplayable
                </a>
            </li>
        </ul>
    </div>
</template>

<script>
import postData from '../../../../mixins/postData.js';

export default {
    name: 'ObviousnessSeverity',
    mixins: [ postData ],
    props: {
        obviousness: {
            type: Number || null,
            default: null,
        },
        severity: {
            type: Number || null,
            default: null,
        },
        eventId: {
            type: String,
            required: true,
        },
        eventType: {
            type: String,
            required: true,
        },
    },
    methods: {
        async updateObviousness(obviousness) {
            let result = await this.executePost('/dataCollection/updateObviousness/' + this.eventId, { obviousness });
            if (result == this.obviousness) result = null;
            this.$store.commit('updateEvent', { id: this.eventId, type: this.eventType, modifiedField: 'obviousness', value: result });
            this.$store.dispatch('updateToastMessages', {
                message: `updated obviousness`,
                type: 'info',
            });
        },
        async updateSeverity(severity) {
            let result = await this.executePost('/dataCollection/updateSeverity/' + this.eventId, { severity });
            if (result == this.severity) result = null;
            this.$store.commit('updateEvent', { id: this.eventId, type: this.eventType, modifiedField: 'severity', value: result });
            this.$store.dispatch('updateToastMessages', {
                message: `updated severity`,
                type: 'info',
            });
        },
    },
};
</script>
