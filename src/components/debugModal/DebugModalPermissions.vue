<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-3">
                <div>Permissions</div>
                <small class="text-secondary">
                    Change your permissions here
                </small>
            </div>
            <div class="col-sm-9">
                <button
                    class="btn btn-sm mb-3 mt-1 btn-nat"
                    @click="moveToNat($event)"
                >
                    move to NAT
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-nat"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Make sure you're already NAT with a mode before using this"
                    @click="moveToStructuralNat($event)"
                >
                    move to structural NAT
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-trial-nat"
                    @click="moveToTrialNat($event)"
                >
                    move to BN Evaluator
                </button>
                <br>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-bn"
                    @click="moveToBn('osu', $event)"
                >
                    move to osu! full BN
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-bn"
                    @click="moveToBn('taiko', $event)"
                >
                    move to osu!taiko full BN
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-bn"
                    @click="moveToBn('catch', $event)"
                >
                    move to osu!catch full BN
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-bn"
                    @click="moveToBn('mania', $event)"
                >
                    move to osu!mania full BN
                </button>
                <br>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-probation"
                    @click="moveToProbation('osu', $event)"
                >
                    move to osu! probation
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-probation"
                    @click="moveToProbation('taiko', $event)"
                >
                    move to osu!taiko probation
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-probation"
                    @click="moveToProbation('catch', $event)"
                >
                    move to osu!catch probation
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-probation"
                    @click="moveToProbation('mania', $event)"
                >
                    move to osu!mania probation
                </button>
                <br>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-danger"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="This won't remove you from the BN group, it will only remove your mode from full and probation"
                    @click="removeFromBn('osu', $event)"
                >
                    remove from osu! BN
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-danger"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="This won't remove you from the BN group, it will only remove your mode from full and probation"
                    @click="removeFromBn('taiko', $event)"
                >
                    remove from osu!taiko BN
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-danger"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="This won't remove you from the BN group, it will only remove your mode from full and probation"
                    @click="removeFromBn('catch', $event)"
                >
                    remove from osu!catch BN
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-danger"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="This won't remove you from the BN group, it will only remove your mode from full and probation"
                    @click="removeFromBn('mania', $event)"
                >
                    remove from osu!mania BN
                </button>
                <br>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-gmt"
                    @click="moveToGmt($event)"
                >
                    add to GMT
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-gmt"
                    @click="removeFromGmt($event)"
                >
                    remove from GMT
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-primary"
                    @click="moveToUser($event)"
                >
                    move to user
                </button>
                <button
                    class="btn btn-sm mb-3 mt-1 btn-primary"
                    @click="toggleIsNatLeader($event)"
                >
                    toggle isNatLeader
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    methods: {
        async moveToNat (e) {
            await this.$http.executePost(`/debug/moveToNat`, {}, e);
        },

        async moveToTrialNat (e) {
            await this.$http.executePost(`/debug/moveToTrialNat`, {}, e);
        },

        async moveToBn (mode, e) {
            await this.$http.executePost(`/debug/moveToBn/${mode}`, {}, e);
        },

        async moveToProbation (mode, e) {
            await this.$http.executePost(`/debug/moveToProbation/${mode}`, {}, e);
        },

        async removeFromBn (mode, e) {
            await this.$http.executePost(`/debug/removeFromBn/${mode}`, {}, e);
        },

        async moveToGmt (e) {
            await this.$http.executePost(`/debug/moveToGmt`, {}, e);
        },

        async removeFromGmt (e) {
            await this.$http.executePost(`/debug/removeFromGmt`, {}, e);
        },

        async moveToUser (e) {
            await this.$http.executePost(`/debug/moveToUser`, {}, e);
        },

        async toggleIsNatLeader (e) {
            await this.$http.executePost(`/debug/toggleIsNatLeader`, {}, e);
        },
        async moveToStructuralNat (e) {
            await this.$http.executePost(`/debug/moveToStructuralNat`, {}, e);
        },
    },
};
</script>
