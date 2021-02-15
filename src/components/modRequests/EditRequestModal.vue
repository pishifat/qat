<template>
    <modal-dialog
        id="editRequestModal"
        :title="fullTitle"
    >
        <div v-if="selectedEditRequest" class="container">
            <div class="row">
                <div class="col-sm-7">
                    Comment:
                    <textarea
                        v-model.trim="comment"
                        class="form-control"
                        placeholder="comment"
                        rows="3"
                    />
                </div>
                <div class="col-sm-5 form-inline justify-content-around">
                    <div>
                        Category:
                        <select
                            v-model="category"
                            class="form-control my-1"
                        >
                            <option value="" disabled>
                                Select a category
                            </option>
                            <option value="simple">
                                Simple
                            </option>
                            <option value="tech">
                                Tech
                            </option>
                            <option value="doubleBpm">
                                Double BPM
                            </option>
                            <option value="conceptual">
                                Conceptual
                            </option>
                            <option value="other">
                                Other
                            </option>
                        </select>
                    </div>
                    <button class="btn btn-primary" @click="editRequest($event)">
                        Save
                    </button>
                </div>
            </div>
        </div>
    </modal-dialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import postData from '../../mixins/postData.js';
import ModalDialog from '../ModalDialog.vue';

export default {
    name: 'EditRequestModal',
    components: {
        ModalDialog,
    },
    mixins: [ postData ],
    data () {
        return {
            comment: '',
            category: '',
        };
    },
    computed: {
        ...mapState('modRequests', [
            'editingRequestId',
        ]),
        ...mapGetters('modRequests', [
            'selectedEditRequest',
        ]),
        /** @returns {string} */
        fullTitle () {
            if (this.selectedEditRequest) {
                return this.selectedEditRequest.beatmapset.fullTitle;
            }

            return '';
        },
    },
    watch: {
        selectedEditRequest (req) {
            this.comment = (req && req.comment) || '';
            this.category = (req && req.category) || '';
        },
    },
    methods: {
        async editRequest (e) {
            let updateData = {
                comment: this.comment,
                category: this.category,
            };

            await this.executePost(`/modRequests/${this.editingRequestId}/edit`, updateData, e);

            const data = await this.executeGet('/modRequests/owned');
            if (!data.error) this.$store.commit('modRequests/setOwnRequests', data);

            this.$store.dispatch('updateToastMessages', {
                message: 'Saved comment.',
                type: 'info',
            });
        },
    },
};
</script>
