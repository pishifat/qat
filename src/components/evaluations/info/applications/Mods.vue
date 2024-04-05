<template>
    <div>
        <div v-for="(mod, i) in mods" :key="i">
            <div>
                <b>Beatmap {{ i+1 }}:</b>
                <ul class="small text-secondary">
                    <li>
                        <b>Mod:</b>
                        <a :href="modUrl(mod)" target="_blank">{{ modUrl(mod) }}</a>
                    </li>
                    <li>
                        <b>.osz:</b> 
                        <a
                            v-if="isValidUrl(oszs[i])"
                            :href="oszs[i]"
                            target="_blank"
                        >
                            {{ oszs[i] }}
                        </a>
                        <span v-else class="text-secondary">
                            {{ oszs[i] }}
                        </span>
                    </li>
                    <li>
                        <span v-if="isNewEvaluationFormat">
                            <b v-if="i == 0">Briefly describe why the map is ready (or nearly ready) to be nominated:</b>
                            <b v-else-if="i == 1">Briefly explain why the map is NOT ready to be nominated (use your modding to back up your reasons!):</b>
                            <b v-else-if="i == 2">
                                Respond to either of these:
                                <ul>
                                    <li>Briefly describe why the map is ready (or nearly ready) to be nominated</li>
                                    <li>Briefly explain why the map is NOT ready to be nominated</li>
                                </ul>
                            </b>
                        </span>
                        <span v-else>
                            <b>Additional info:</b>
                        </span>
                        <span v-html="$md.render(reasons[i])" />
                    </li>
                </ul>
            </div>
        </div>
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
        oszs: {
            type: Array,
            default() {
                return [];
            },
        },
        osuId: {
            type: Number,
            required: true,
        },
        isNewEvaluationFormat: Boolean,
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
        isValidUrl(url, contain) {
            const regexp = /^(?:(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?|mailto:[^\s@]+@[^\s@]+\.[^\s@]+)$/;

            if (!regexp.test(url) || (contain && !url.includes(contain))) {
                return false;
            } else {
                return true;
            }
        }
    },
};
</script>