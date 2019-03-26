<template>

<div id="extendedInfo" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="veto">
            <div class="modal-header text-dark" :class="'bg-' + veto.status">
                <h5 class="modal-title">{{ fullTitle }}</h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: hidden">
                <p class="text-shadow">Beatmap Link: 
                    <a class="small ml-1" :href="veto.beatmapLink">{{ veto.beatmapLink }}</a>
                </p>
                <p class="text-shadow">Reason: 
                    <a class="small ml-1" :href="veto.beatmapLink">{{ veto.reasonLink }}</a>
                </p>
                <p class="text-shadow">
                    Status: <small>{{ veto.status }}</small>
                    <button class="btn btn-sm btn-qat" @click="setStatus('upheld')">Upheld</button>
                    <button class="btn btn-sm btn-qat" @click="setStatus('withdrawn')">Withdrawn</button>
                </p>
                <p class="text-shadow">People Involved:</p>
                <ul v-for="debater in veto.debaters" :key="debater.id">
                    <li>{{ debater.username }}</li>
                </ul>
                <p class="text-shadow" v-if="veto.mediator">Mediator: <small>{{ veto.mediator.username }}</small></p>
                <p class="text-shadow" v-else-if="isMediator"><button class="btn btn-sm btn-qat" @click="mediate()">Mediate this!</button></p>
            </div>
            <div class="modal-footer">
                {{ this.info }}
            </div>
        </div>
    </div>
</div>

</template>

<script>
import postData from "../../mixins/postData.js";

export default {
    name: 'veto-info',
    props: [ 'veto', 'user-id', 'is-mediator' ],
    mixins: [ postData ],
    data() {
        return {
            info: null,
        }
    },
    methods: {
        mediate: async function() {
            const r = await this.executePost('/qat/vetoes/mediate', { veto: this.veto });
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.$emit('update-veto', r);
                }
            }
        },
        setStatus: async function(status) {
            const r = await this.executePost('/qat/vetoes/setStatus', { veto: this.veto, status: status });
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.$emit('update-veto', r);
                }
            }
        }
    },
    computed: {
        fullTitle: function() {
            if (this.veto.beatmapTitle) {
                return this.veto.beatmapTitle + ' by ' + this.veto.beatmapMapper
            } else {
                return 'something';
            }
        },
    },
}
</script>

<style>
    .bg-available {
        background-color: var(--available);
    }
    .bg-wip {
        background-color: var(--wip);
    }
    .bg-upheld {
        background-color: var(--upheld);
    }
    .bg-withdrawn {
        background-color: var(--withdrawn);
    }
</style>
