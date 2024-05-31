<template>
    <span
        data-toggle="tooltip"
        :title="tooltip"
    >
        {{ momented.locale('en').fromNow() }}
    </span>
</template>

<script>
export default {
    name: 'DateDisplay',
    props: {
        date: {
            type: String,
            required: true,
        },
        includeTime: Boolean,
    },
    computed: {
        momented () {
            return this.$moment(this.date);
        },
        tooltip () {
            if (this.includeTime) {
                return this.momented.format('MMM D, YYYY h A [GMT]Z');
            } else {
                return this.momented.format('MMM D, YYYY');
            }
        },
    },
};
</script>
