<template>
    <div class="form-inline mb-2">
        <b>Question type:</b>

        <div class="form-check form-check-inline ml-2">
            <input
                :id="`${forLabel}-text`"
                class="form-check-input"
                type="radio"
                value="text"
                :checked="'text' === questionType"
                @change="$emit('change', $event.target.value)"
            >

            <label
                class="form-check-label"
                :for="`${forLabel}-text`"
            >
                Select text
            </label>
        </div>
        <div class="form-check form-check-inline">
            <input
                :id="`${forLabel}-image`"
                class="form-check-input"
                type="radio"
                value="image"
                :checked="'image' === questionType"
                @change="$emit('change', $event.target.value)"
            >

            <label
                class="form-check-label"
                :for="`${forLabel}-image`"
            >
                Select Image
            </label>
        </div>
    </div>
</template>

<script>
export default {
    name: 'QuestionType',
    model: {
        prop: 'questionType',
        event: 'change',
    },
    props: {
        questionType: {
            type: String,
            default: '',
        },
        forLabel: {
            type: String,
            required: true,
        },
    },
};
</script>
