<template>
    <div>
        <div class="container">
            <div class="row">
                <span class="col-sm-12 small text-secondary mb-2">
                    For temporary things.
                </span>
            </div>
            <div class="row">
                <div class="col-sm-12 d-flex flex-wrap align-items-center">
                    <label for="date">Input:</label>
                    <input
                        v-model="input"
                        class="form-control mx-2"
                        placeholder="input..."
                    >
                    <button
                        class="btn btn-sm btn-primary"
                        @click="doTemporaryThing($event)"
                    >
                        Button
                    </button>
                </div>
            </div>
            <div v-if="output" class="row">
                <code>{{ output }}</code>
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'TemporaryInfo',
    components: {
        UserLink,
    },
    data () {
        return {
            input: '',
            output: null,
        };
    },
    methods: {
        async doTemporaryThing(e) {
            const output = await this.$http.executePost(`/users/doTemporaryThing`, { input: this.input }, e);

            if (this.$http.isValid(output)) {
                this.output = output;
            }
        },
    },
};
</script>
