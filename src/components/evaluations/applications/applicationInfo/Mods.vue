<template>
    <div>
        <p class="text-shadow min-spacing">
            Modding:
        </p>
        <ul style="list-style-type: disc;">
            <li v-for="(mod, i) in mods" :key="i" class="small text-shadow">
                <a :href="modUrl(mod)" target="_blank">{{ modUrl(mod) }}</a>
            </li>
            <li class="small text-shadow">
                <a :href="'https://osu.ppy.sh/users/' + osuId + '/modding/events?types%5B%5D=kudosu_gain&types%5B%5D=kudosu_lost&min_date=&max_date='" target="_blank">All history</a>
            </li>
        </ul>
    </div>
</template>

<script>

export default {
    name: 'mods',
    props: {
        mods: Array,
        osuId: Number,
    },
    methods: {
        modUrl(mod){
            if (mod.indexOf('https://osu.ppy.sh/beatmapsets/') == 0 && (mod.indexOf('#') < 0 || mod.indexOf('#') > 40)) {
                mod = mod.slice(31);
                let indexEnd = mod.indexOf('/');
                if(indexEnd == -1) indexEnd = mod.length;
                return `https://osu.ppy.sh/beatmapsets/${mod.slice(0, indexEnd)}/discussion/timeline?user=${this.osuId}`;
            }else{
                return mod;
            }
        },
    },
};
</script>