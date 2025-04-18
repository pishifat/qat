<template>
    <div>
        <p>
            <b>Obviousness:</b>
        </p>
        <ul class="small">
            <li>
                <a href="#" :class="obviousness == 0 ? 'text-danger' : ''" @click.prevent="updateObviousness(0)">
                    0: Not obvious
                </a>
            </li>
            <li>
                <a href="#" :class="obviousness == 1 ? 'text-danger' : ''" @click.prevent="updateObviousness(1)">
                    1: Can be found with experience
                </a>
            </li>
            <li>
                <a href="#" :class="obviousness == 2 ? 'text-danger' : ''" @click.prevent="updateObviousness(2)">
                    2: Can be found at a glance
                </a>
            </li>
        </ul>

        <p>
            <b>Severity:</b>
        </p>
        <ul class="small">
            <li>
                <a href="#" :class="severity == 0 ? 'text-danger' : ''" @click.prevent="updateSeverity(0)">
                    0: Not severe
                </a>
            </li>
            <li>
                <a href="#" :class="severity == 1 ? 'text-danger' : ''" @click.prevent="updateSeverity(1)">
                    1: Slightly detrimental to gameplay
                </a>
            </li>
            <li>
                <a href="#" :class="severity == 2 ? 'text-danger' : ''" @click.prevent="updateSeverity(2)">
                    2: Noticably detrimental to gameplay
                </a>
            </li>
            <li>
                <a href="#" :class="severity == 3 ? 'text-danger' : ''" @click.prevent="updateSeverity(3)">
                    3: More or less unplayable
                </a>
            </li>
        </ul>
        <small v-if="isNominationResetEditing && changed" class="small text-secondary">(refresh to see changes)</small>
    </div>
</template>

<script>
export default {
    name: 'ObviousnessSeverity',
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
        type: {
            type: String,
            required: true,
        },
        isNominationResetEditing: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            changed: false,
        };
    },
    methods: {
        async updateObviousness(obviousness) {
            let data = await this.$http.executePost('/dataCollection/updateObviousness/' + this.eventId, { obviousness });

            if (this.$http.isValid(data)) {
                this.$store.commit('dataCollection/updateEvent', {
                    id: this.eventId,
                    type: this.type,
                    modifiedField: 'obviousness',
                    value: data.obviousness,
                });
                this.changed = true;
            }
        },
        async updateSeverity(severity) {
            let data = await this.$http.executePost('/dataCollection/updateSeverity/' + this.eventId, { severity });

            if (this.$http.isValid(data)) {
                this.$store.commit('dataCollection/updateEvent', {
                    id: this.eventId,
                    type: this.type,
                    modifiedField: 'severity',
                    value: data.severity,
                });
                this.changed = true;
            }
        },
    },
};
</script>