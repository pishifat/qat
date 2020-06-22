<template>
    <textarea
        class="form-control mb-2"
        placeholder="question..."
        maxlength="300"
        rows="4"
        :value="value"
        @input="$emit('input', $event.target.value)"
    />
</template>

<script>
export default {
    name: 'QuestionContent',
    props: {
        value: {
            type: String,
            default: '',
        },
    },
};
</script>
