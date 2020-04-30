<template>
    <div class="small mt-2 d-flex align-items-center">
        <div class="col-sm-12">
            Due by
        </div>
        <div class="col-sm-12 truncate errors">
            {{ deadline }}
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

