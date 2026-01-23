<template>
    <modal-dialog id="addVeto" title="Submit a veto anonymously">
        <div class="container">
            <!-- game mode -->
            <p><b>Game mode</b></p>
            <div class="row ml-4">
                <mode-select
                    v-model="mode"
                    :max-selection="1"
                    :all-modes="true"
                    class="ml-2 mb-2"
                />
            </div>

            <!-- url -->
            <p><b>Beatmap URL</b></p>
            <div class="row ml-4 mb-2">
                <input
                    v-model="url"
                    type="text"
                    class="form-control"
                    placeholder="beatmap URL..."
                >
            </div>

            <!-- veto reasons -->
            <p><b>Veto reasons</b></p>
            <div>
                <ol>
                    <li v-if="!vetoReasons.length">
                        No reasons created...
                    </li>
                    <li v-for="reason in vetoReasons" v-else :key="reason.id">
                        <span class="pre-line">{{ reason.summary }}</span>
                        <a
                            v-if="confirmDelete != reason.id"
                            href="#"
                            class="text-neutral small"
                            @click.prevent="summary = reason.summary, removeReason(reason.id)"
                        >
                            edit
                        </a>
                        <a
                            v-if="confirmDelete != reason.id"
                            href="#"
                            class="text-danger small"
                            @click.prevent="confirmDelete = reason.id"
                        >
                            delete
                        </a>
                        <a
                            v-else
                            class="text-danger small"
                            href="#"
                            @click.prevent="removeReason(reason.id)"
                        >
                            confirm
                        </a>
                    </li>
                </ol>
            </div>

            <hr>

            <p><b>Create veto reason</b></p>
            <p class="small mx-2 mb-2">
                <b>Add veto reason</b> will update the list above. When all reasons are added, click <b>Submit</b>.
            </p>

            <textarea
                v-model="summary"
                type="text"
                class="form-control mb-1"
                rows="3"
                placeholder="veto reason..."
            />

            <div v-if="summary.length" class="small mb-2">
                <b>Preview</b> (<a href="https://www.markdownguide.org/basic-syntax/" target="_blank">markdown</a> is supported!)
                <div class="small card card-body v-html-content" v-html="$md.render(summary)" />
            </div>
            

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
import ModeSelect from '../ModeSelect.vue';
import { mapState } from 'vuex';

export default {
    name: 'SubmitVeto',
    components: {
        ModalDialog,
        ModeSelect,
    },
    data() {
        return {
            vetoReasons: [],
            confirmDelete: null,
            url: '',
            summary: '',
            mode: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    methods: {
        addReason () {
            if (!this.summary.length) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Cannot submit empty reason!`,
                    type: 'danger',
                });
            } else {
                this.vetoReasons.push({
                    id: new Date().getTime(), // unique number
                    summary: this.summary,
                });
            }

            this.summary = '';
        },
        isValidUrl(url) {
            const regexp = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;

            return regexp.test(url) && url.includes('osu.ppy.sh/beatmapsets');
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
            } else if (!this.isValidUrl(this.url)) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Invalid beatmap URL!`,
                    type: 'danger',
                });
            } else {
                const data = await this.$http.executePost(
                    '/vetoes/submit',
                    {
                        mode: this.mode,
                        url: this.url,
                        reasons: this.vetoReasons,
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