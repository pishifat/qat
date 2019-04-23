<template>

<div id="editReason" class="modal fade" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content custom-bg-dark" v-if="selectedEntry">
            <div class="modal-header text-dark" :class="selectedEntry.valid == 1 ? 'badge-pass' : selectedEntry.valid == 2 ? 'badge-extend' : selectedEntry.valid == 3 ? 'badge-fail' : 'bg-nat-logo'">
                <h5 class="modal-title">Edit DQ/Reset</h5>
                <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="container">
                    <p class="text-shadow">Mapset: <a :href="'https://osu.ppy.sh/beatmapsets/' + selectedEntry.beatmapsetId + '/discussion/-/events'" target="_blank">{{selectedEntry.metadata}}</a></p>
                    <p class="text-shadow">Current reason: </p>
                    <p class="text-shadow small ml-4">{{selectedEntry.content}}</p>
                    <p class="text-shadow" for="newReason">New reason:</p>
                    <div class="input-group input-group-sm">
                        <input class="form-control form-control-sm" type="text" placeholder="Reason..." id="newReason" 
                            style="filter: drop-shadow(1px 1px 1px #000000); border-radius: 100px 100px 100px 100px" 
                            @keyup.enter="updateReason($event)" maxlength="50" v-model="reasonInput"/>
                    </div>
                    <p class="text-shadow mt-4">Notability:
                        <notability
                            :selected-entry="selectedEntry"
                            :is-spectator="isSpectator"
                        ></notability>
                    </p>
                    
                </div>
                <p id="errors">{{info}}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-nat" @click="updateReason($event)" type="submit"><span class="append-button-padding">Save reason</span></button>
            </div>
        </div>
    </div>
</div>

</template>

<script>
import postData from '../../mixins/postData.js';
import Notability from './Notability.vue';

export default {
    name: 'data-collection-info',
    mixins: [postData],
    props: [ 'selected-entry', 'is-spectator' ],
    components: {
        Notability
    },
    watch: {
        selectedEntry: function() {
            this.reasonInput = '';
        }
    },
    methods: {
        updateNotability: async function(entryId, notability) {
            if(!this.isSpectator){
                const result = await this.executePost('/dataCollection/updateNotability/' + entryId, { notability: notability });
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.$parent.updateEntry(result);
                    }
                }
            }
        },
        updateReason: async function(e) {
            if(!this.reasonInput || !this.reasonInput.length){
                this.info = "Must enter a reason!"
            }else if(!this.isSpectator){
                const result = await this.executePost('/dataCollection/updateReason/' + this.selectedEntry.id, { reason: this.reasonInput }, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.updateEntry(result);
                    }
                }
            }
        },
        updateEntry: function(result) {
            this.$parent.updateEntry(result);
        }
    },
    data() {
        return {
            reasonInput: '',
            confirm: '',
            info: '',
        };
    },
}
</script>