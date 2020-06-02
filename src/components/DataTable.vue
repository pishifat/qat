<template>
    <table
        class="table table-hover table-dark table-responsive-lg table-sm"
    >
        <thead>
            <tr>
                <template v-if="headers.length">
                    <th v-for="header in headers" :key="header">
                        {{ header }}
                    </th>
                </template>

                <slot name="headers" />
            </tr>
        </thead>

        <tbody>
            <slot />
        </tbody>
    </table>
</template>

<script>
export default {
    name: 'DataTable',
    props: {
        headers: {
            type: Array,
            default () {
                return [];
            },
        },
    },
};
</script>
