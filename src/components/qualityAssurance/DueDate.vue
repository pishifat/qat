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
        time: {
            type: String,
            required: true,
        },
    },
    computed: {
        deadline() {
            return this.$moment(this.time).add(7, 'days').fromNow();
        },
    },
};
</script>

