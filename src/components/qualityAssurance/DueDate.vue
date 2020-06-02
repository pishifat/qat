<template>
    <div class="small">
        <div>
            Due by
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
            let date = new Date(this.timestamp);
            date.setDate(date.getDate() + 7);

            return date.toISOString().slice(5,10);
        },
    },
};
</script>

