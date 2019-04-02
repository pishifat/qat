<template>

<div id="extendedInfo" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="veto">
            <div class="modal-header text-dark" :class="'bg-' + veto.status">
                <h5 class="modal-title">
                    <a class="text-dark" :href="'https://osu.ppy.sh/beatmapsets/' + veto.beatmapId">{{ veto.beatmapTitle }}</a> by 
                    <a class="text-dark" :href="'https://osu.ppy.sh/users/' + veto.beatmapMapperId">{{ veto.beatmapMapper }}</a>
                </h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: hidden">
                <div class="text-shadow">
                    <a :href="veto.discussionLink">Read the veto discussion here</a>
                    <br>
                    <small class="ml-2">Veto reason: <i>{{ veto.shortReason }}</i></small>
                </div>
                <hr>
                <p class="text-shadow small ml-4">
                </p>
                <p class="text-shadow">
                    Status: <small>{{ veto.status }}</small>
                    <button class="btn btn-sm btn-nat" @click="setStatus('upheld')">Upheld</button>
                    <button class="btn btn-sm btn-nat" @click="setStatus('withdrawn')">Withdrawn</button>
                </p>
                <p class="text-shadow">People Involved:</p>
                <ul v-for="debater in veto.debaters" :key="debater.id">
                    <li>{{ debater.username }}</li>
                </ul>
                <p class="text-shadow" v-if="veto.mediator">Vetoed by <small>{{ veto.vetoer.username }}</small></p>
                <p class="text-shadow" v-else-if="isMediator"><button class="btn btn-sm btn-nat" @click="mediate()">Mediate this!</button></p>
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
            const r = await this.executePost('/nat/vetoes/mediate', { veto: this.veto });
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.$emit('update-veto', r);
                }
            }
        },
        setStatus: async function(status) {
            const r = await this.executePost('/nat/vetoes/setStatus', { veto: this.veto, status: status });
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
