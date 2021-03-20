<template>
    <section v-if="minecraft" class="card card-body">
        <div class="d-flex align-items-center mb-1">
            <h4 class="mb-0">
                Minecraft
            </h4>
        </div>
        <pre class="text-white">{{ minecraft }}</pre>
        <small class="text-secondary">
            BN Minecraft server hosted by <a href="https://osu.ppy.sh/users/7451883" target="_blank">Nevo</a>.
            This is only visible to Beatmap Nominators and will be removed on 3/27/2021
        </small>
    </section>
</template>

<script>
import postData from '../../mixins/postData';

export default {
    name: 'Minecraft',
    mixins: [postData],
    data () {
        return {
            minecraft: null,
        };
    },
    async created() {
        this.minecraft = await this.initialRequest('/minecraft');
    },
};
</script>
