<template>
    <modal-dialog id="addVeto" title="Submit a veto for mediation">
        <div class="container">
            <!-- game mode -->
            <p>Game mode:</p>
            <div class="row ml-4">
                <label
                    class="mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="osu!"
                >
                    <input
                        v-model="mode"
                        type="radio"
                        class="osu-radio hide-default"
                        name="osu"
                        value="osu"
                        checked
                    >
                    <i class="fas fa-circle fa-lg" />
                </label>
                <label
                    class="mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="osu!taiko"
                >
                    <input
                        v-model="mode"
                        type="radio"
                        class="taiko-radio hide-default"
                        name="taiko"
                        value="taiko"
                    >
                    <i class="fas fa-drum fa-lg" />
                </label>
                <label
                    class="mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="osu!catch"
                >
                    <input
                        v-model="mode"
                        type="radio"
                        class="catch-radio hide-default"
                        name="catch"
                        value="catch"
                    >
                    <i class="fas fa-apple-alt fa-lg" />
                </label>
                <label
                    class="mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="osu!mania"
                >
                    <input
                        v-model="mode"
                        type="radio"
                        class="mania-radio hide-default"
                        name="mania"
                        value="mania"
                    >
                    <i class="fas fa-stream fa-lg" />
                </label>
                <label
                    class="mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="all game modes"
                >
                    <input
                        v-model="mode"
                        type="radio"
                        class="all-radio hide-default"
                        name="all"
                        value="all"
                    >
                    <i class="fas fa-globe fa-lg" />
                </label>
            </div>


            <!-- re-mediation -->
            <p>Re-mediation:</p>
                <div class="row ml-4">
                <label
                    class="mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="mediated by 20% of bns"
                >
                    <input
                        v-model="remediation"
                        type="radio"
                        class="cross-radio hide-default"
                        name="remediation"
                        value="noRemediation"
                    >
                    <i class="fas fa-times fa-lg" />
                </label>
                <label
                    class="mx-1"
                    data-toggle="tooltip"
                    data-placement="top"
                    title="mediated by 100% of bns"
                >
                    <input
                        v-model="remediation"
                        type="radio"
                        class="checkmark-radio hide-default"
                        name="remediation"
                        value="remediation"
                    >
                    <i class="fas fa-check fa-lg" />
                </label>
            </div>

            <!-- veto reasons -->
            <p>Veto reasons:</p>
            <div>
                <ul>
                    <li v-if="!vetoReasons.length">
                        No reasons created...
                    </li>
                    <li v-for="reason in vetoReasons" v-else :key="reason.id">
                        <a :href="reason.link" target="_blank">
                            {{ reason.summary }}
                        </a>
                        <a
                            v-if="confirmDelete != reason.id"
                            href="#"
                            class="text-danger"
                            @click.prevent="confirmDelete = reason.id"
                        >
                            delete
                        </a>
                        <a
                            v-else
                            class="text-danger"
                            href="#"
                            @click.prevent="removeReason(reason.id)"
                        >
                            confirm
                        </a>
                    </li>
                </ul>
            </div>

            <hr>

            <p>Create veto reason:</p>
            <p class="small mx-2 mb-2">
                Add veto reasons by linking a discussion post and summarizing the issue. <b>Add veto reason</b> will update the list above. When all reasons are added, click <b>Submit</b>.
            </p>
            <input
                v-model="link"
                type="text"
                class="form-control"
                placeholder="discussion link..."
            >

            <input
                v-model="summary"
                type="text"
                class="form-control mb-1"
                placeholder="summary of issue..."
            >

            <button type="submit" class="btn btn-primary btn-block" @click="addReason()">
                Add veto reason
            </button>
            <hr>

            <button type="submit" class="btn btn-primary float-right" @click="submitVeto($event)">
                Submit
            </button>
        </div>
    </modal-dialog>
</template>

<script>
import ModalDialog from '../ModalDialog.vue';

export default {
    name: 'SubmitVeto',
    components: {
        ModalDialog,
    },
    data() {
        return {
            vetoReasons: [],
            confirmDelete: null,
            link: '',
            summary: '',
            mode: null,
            remediation: 'noRemediation',
        };
    },
    methods: {
        addReason () {
            if (!this.link.length || !this.summary.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot leave fields blank!`,
                    type: 'danger',
                });
            } else if (!this.isValidUrl(this.link)) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Links must be discussion posts from the same mapset!`,
                    type: 'danger',
                });
            } else {
                this.vetoReasons.push({
                    id: new Date().getTime(), // unique number
                    link: this.link,
                    summary: this.summary,
                });

                this.link = '';
                this.summary = '';
            }
        },
        isValidUrl(url) {
            let bmId;

            if (this.vetoReasons.length) {
                const firstUrl = this.vetoReasons[0].link;
                let indexStart = firstUrl.indexOf('beatmapsets/') + 'beatmapsets/'.length;
                let indexEnd = firstUrl.indexOf('/discussion');

                if (indexEnd !== -1) {
                    bmId = firstUrl.slice(indexStart, indexEnd);
                } else {
                    bmId = firstUrl.slice(indexStart);
                }
            } else {
                bmId = '';
            }

            const regexp = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;

            return regexp.test(url) && url.includes('osu.ppy.sh/beatmapsets') && url.includes('discussion') && url.includes(bmId);
        },
        removeReason (id) {
            const i = this.vetoReasons.findIndex(r => r.id === id);
            this.vetoReasons.splice(i, 1);
            this.confirmDelete = null;
        },
        async submitVeto (e) {
            if (!this.mode) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Must select a mode!`,
                    type: 'danger',
                });
            } else if (!this.vetoReasons.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Must include veto reasons!`,
                    type: 'danger',
                });
            } else {
                const data = await this.$http.executePost(
                    '/vetoes/submit',
                    {
                        reasons: this.vetoReasons,
                        mode: this.mode,
                        remediation: this.remediation,
                    },
                    e
                );

                if (this.$http.isValid(data)) {
                    $('#addVeto').modal('hide');
                    this.$store.commit('vetoes/addVeto', data.veto);
                }
            }
        },
    },
};
</script>