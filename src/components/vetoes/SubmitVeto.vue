<template>
    <div id="addVeto" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-qat">
                    <h5 class="modal-title text-dark">Submit a new veto</h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden">
                    <div class="container">
                        <div class="row mb-1">
                            <input
                                type="text"
                                class="form-control text-input"
                                placeholder="Beatmap Link"
                                v-model="beatmapLink"
                            />
                        </div>
                        <div class="row mb-1">
                            <input
                                type="text"
                                class="form-control text-input"
                                placeholder="Reason Link"
                                v-model="reasonLink"
                            />
                        </div>
                        <div class="row mb-1">
                            <h4>Game mode:</h4>
                            <div class="row ml-4">
                                <label class="mx-1">
                                    <input type="radio" class="osu-radio hide-default" name="osu" value="osu" v-model="mode" checked />
                                    <i class="fas fa-circle fa-lg"></i>
                                </label>
                                <label class="mx-1">
                                    <input type="radio" class="taiko-radio hide-default" name="taiko" value="taiko" v-model="mode" />
                                    <i class="fas fa-drum fa-lg"></i>
                                </label>
                                <label class="mx-1">
                                    <input type="radio" class="catch-radio hide-default" name="catch" value="catch" v-model="mode" />
                                    <i class="fas fa-apple-alt fa-lg"></i>
                                </label>
                                <label class="mx-1">
                                    <input type="radio" class="mania-radio hide-default" name="mania" value="mania" v-model="mode" />
                                    <i class="fas fa-stream fa-lg"></i>
                                </label>
                            </div>
                        </div>
                        <p class="errors text-shadow">{{ info }}</p>
                        <hr />
                        <button type="submit" class="btn btn-qat float-right" @click="submitVeto($event)">
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'submit-veto',
    mixins: [postData],
    data() {
        return {
            beatmapLink: null,
            reasonLink: null,
            mode: null,
            info: null,
        };
    },
    methods: {
        submitVeto: async function(e) {
            if (!this.beatmapLink || !this.beatmapLink || !this.mode) {
                this.info = 'Fill the info';
            } else {
                const veto = await this.executePost(
                    '/qat/vetoes/submit',
                    {
                        beatmapLink: this.beatmapLink,
                        reasonLink: this.reasonLink,
                        mode: this.mode,
                    },
                    e
                );

                if (veto) {
                    if (veto.error) {
                        this.info = veto.error;
                    } else {
                        $('#addVeto').modal('hide');
                        this.$emit('submit-veto', veto);
                    }
                }
            }
        },
    },
};
</script>

<style>
</style>
