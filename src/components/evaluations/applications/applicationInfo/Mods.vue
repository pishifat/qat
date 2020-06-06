<template>
    <div>
        <p>
            <b>Modding:</b>
        </p>

        <ul>
            <li v-for="(mod, i) in mods" :key="i" class="small">
                <a :href="modUrl(mod)" target="_blank">{{ modUrl(mod) }}</a><br>
                <span
                    v-if="reasons && reasons.length"
                    class="text-secondary"
                    v-html="$md.render(reasons[i])"
                />
            </li>
            <li class="small">
                <a :href="'https://osu.ppy.sh/users/' + osuId + '/modding/events?types%5B%5D=kudosu_gain&types%5B%5D=kudosu_lost&min_date=&max_date='" target="_blank">All history</a>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'Mods',
    props: {
        mods: {
            type: Array,
            default() {
                return [];
            },
        },
        reasons: {
            type: Array,
            default() {
                return [];
            },
        },
        osuId: {
            type: Number,
            required: true,
        },
    },
    methods: {
        modUrl(mod) {
            if (mod.indexOf('https://osu.ppy.sh/beatmapsets/') == 0 && (mod.indexOf('#') < 0 || mod.indexOf('#') > 40)) {
                mod = mod.slice(31);
                let indexEnd = mod.indexOf('/');
                if (indexEnd == -1) indexEnd = mod.length;

                return `https://osu.ppy.sh/beatmapsets/${mod.slice(0, indexEnd)}/discussion/timeline?user=${this.osuId}`;
            } else {
                return mod;
            }
        },
    },
};
</script>