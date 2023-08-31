<template>
    <div class="d-inline-flex align-items-center">
        <label
            class="mx-1 my-0"
            data-toggle="tooltip"
            data-placement="top"
            title="osu!"
        >
            <input
                :type="inputType"
                class="osu-radio hide-default"
                value="osu"
                :checked="checkSelected('osu')"
                @change="updateSelectedMode($event)"
            >
            <i class="fas fa-circle fa-lg" />
        </label>

        <label
            class="mx-1 my-0"
            data-toggle="tooltip"
            data-placement="top"
            title="osu!taiko"
        >
            <input
                :type="inputType"
                class="taiko-radio hide-default"
                value="taiko"
                :checked="checkSelected('taiko')"
                @change="updateSelectedMode($event)"
            >
            <i class="fas fa-drum fa-lg" />
        </label>

        <label
            class="mx-1 my-0"
            data-toggle="tooltip"
            data-placement="top"
            title="osu!catch"
        >
            <input
                :type="inputType"
                class="catch-radio hide-default"
                value="catch"
                :checked="checkSelected('catch')"
                @change="updateSelectedMode($event)"
            >
            <i class="fas fa-apple-alt fa-lg" />
        </label>

        <label
            class="mx-1 my-0"
            data-toggle="tooltip"
            data-placement="top"
            title="osu!mania"
        >
            <input
                :type="inputType"
                class="mania-radio hide-default"
                value="mania"
                :checked="checkSelected('mania')"
                @change="updateSelectedMode($event)"
            >
            <i class="fas fa-stream fa-lg" />
        </label>
    </div>
</template>

<script>
export default {
    name: 'ModeRadioDisplay',
    model: {
        prop: 'selectedMode',
        event: 'change',
    },
    props: {
        selectedMode: {
            type: [ String, Array ],
            required: true,
        },
        inputType: {
            type: String,
            default: 'radio',
        },
    },
    methods: {
        updateSelectedMode (e) {
            const selectedModes = this.selectedMode;

            if (this.inputType === 'checkbox') {
                if (e.target.checked) {
                    selectedModes.push(e.target.value);
                } else {
                    const i = selectedModes.findIndex(m => m === e.target.value);
                    selectedModes.splice(i, 1);
                }

                this.$emit('change', selectedModes);
            } else {
                this.$emit('change', e.target.value);
            }
        },
        checkSelected (mode) {
            return this.selectedMode.includes(mode);
        },
    },
};
</script>