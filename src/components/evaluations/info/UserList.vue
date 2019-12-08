<template>
    <div>
        <p class="text-shadow min-spacing">
            {{ header }} 
        </p>
        <ul>
            <li v-for="user in userList" :key="user.id" class="small text-shadow">
                {{ user.username }}
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'user-list',
    props: {
        header: String,
        userList: Array,
    },
};
</script>