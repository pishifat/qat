<template>
    <div class="small">
        <div>
            Due
        </div>

        <div class="text-truncate text-danger">
            <b>{{ deadline }}</b>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DueDate',
    props: {
        timestamp: {
            type: String,
            required: true,
        },
    },
    computed: {
        deadline() {
            return this.$moment(this.timestamp).add(7, 'days').fromNow();
        },
    },
};
</script>

