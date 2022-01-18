<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6">
                <div>What are your preferred song genres?</div>
                <small class="text-secondary">
                    Select up to 3
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="genre in genreOptions" :key="genre" class="form-check">
                    <input
                        :checked="genrePreferences.includes(genre)"
                        :value="genre"
                        type="checkbox"
                        class="form-check-input"
                        :disabled="(genrePreferences.length >= 3 && !genrePreferences.includes(genre)) || processing"
                        @change="updateGenrePreferences(genre, $event)"
                    >
                    <label
                        class="form-check-label text-secondary"
                    >
                        {{ genre }}
                    </label>
                </div>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-sm-6">
                <div>What are your preferred song languages?</div>
                <small class="text-secondary">
                    Select up to 3
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="language in languageOptions" :key="language" class="form-check">
                    <input
                        :checked="languagePreferences.includes(language)"
                        :value="language"
                        type="checkbox"
                        class="form-check-input"
                        :disabled="(languagePreferences.length >= 3 && !languagePreferences.includes(language)) || processing"
                        @change="updateLanguagePreferences(language, $event)"
                    >
                    <label
                        class="form-check-label text-secondary"
                    >
                        {{ language }}
                    </label>
                </div>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-sm-6">
                <div>What are your preferred map styles?</div>
                <small class="text-secondary">
                    Select up to 3
                </small>
            </div>

            <div class="col-sm-6">
                <div v-if="loggedInUser.modes.includes('osu')">
                    <div v-for="style in osuStyleOptions" :key="style" class="form-check">
                        <input
                            :checked="osuStylePreferences.includes(style)"
                            :value="style"
                            type="checkbox"
                            class="form-check-input"
                            :disabled="(osuStylePreferences.length >= 3 && !osuStylePreferences.includes(style)) || processing"
                            @change="updateStylePreferences(style, 'osu', $event)"
                        >
                        <label
                            class="form-check-label text-secondary"
                        >
                            {{ style }} <span class="small">(osu!)</span>
                        </label>
                    </div>
                </div>
                <div v-if="loggedInUser.modes.includes('taiko')">
                    <div v-for="style in taikoStyleOptions" :key="style" class="form-check">
                        <input
                            :checked="taikoStylePreferences.includes(style)"
                            :value="style"
                            type="checkbox"
                            class="form-check-input"
                            :disabled="(taikoStylePreferences.length >= 3 && !taikoStylePreferences.includes(style)) || processing"
                            @change="updateStylePreferences(style, 'taiko', $event)"
                        >
                        <label
                            class="form-check-label text-secondary"
                        >
                            {{ style }} <span class="small">(osu!taiko)</span>
                        </label>
                    </div>
                </div>
                <div v-if="loggedInUser.modes.includes('catch')">
                    <div v-for="style in catchStyleOptions" :key="style" class="form-check">
                        <input
                            :checked="catchStylePreferences.includes(style)"
                            :value="style"
                            type="checkbox"
                            class="form-check-input"
                            :disabled="(catchStylePreferences.length >= 3 && !catchStylePreferences.includes(style)) || processing"
                            @change="updateStylePreferences(style, 'catch', $event)"
                        >
                        <label
                            class="form-check-label text-secondary"
                        >
                            {{ style }} <span class="small">(osu!catch)</span>
                        </label>
                    </div>
                </div>
                <div v-if="loggedInUser.modes.includes('mania')">
                    <div v-for="style in maniaStyleOptions" :key="style" class="form-check">
                        <input
                            :checked="maniaStylePreferences.includes(style)"
                            :value="style"
                            type="checkbox"
                            class="form-check-input"
                            :disabled="(maniaStylePreferences.length >= 3 && !maniaStylePreferences.includes(style)) || processing"
                            @change="updateStylePreferences(style, 'mania', $event)"
                        >
                        <label
                            class="form-check-label text-secondary"
                        >
                            {{ style }} <span class="small">(osu!mania)</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
        <hr>
        <div v-if="loggedInUser.modes.includes('mania')" class="row">
            <div class="col-sm-6">
                <div>What are your preferred keymodes?</div>
                <small class="text-secondary">
                    Select up to 3
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="keymode in maniaKeymodeOptions" :key="keymode" class="form-check">
                    <input
                        :checked="maniaKeymodePreferences.includes(keymode)"
                        :value="keymode"
                        type="checkbox"
                        class="form-check-input"
                        :disabled="(maniaKeymodePreferences.length >= 3 && !maniaKeymodePreferences.includes(keymode)) || processing"
                        @change="updateKeymodePreferences(keymode, $event)"
                    >
                    <label
                        class="form-check-label text-secondary"
                    >
                        {{ keymode }}
                    </label>
                </div>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-sm-6">
                <div>What are your preferred extra song details?</div>
                <small class="text-secondary">
                    Select up to 3. These refer to song sources or other relevant song details
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="detail in detailOptions" :key="detail" class="form-check">
                    <input
                        :checked="detailPreferences.includes(detail)"
                        :value="detail"
                        type="checkbox"
                        class="form-check-input"
                        :disabled="(detailPreferences.length >= 3 && !detailPreferences.includes(detail)) || processing"
                        @change="updateDetailPreferences(detail, $event)"
                    >
                    <label
                        class="form-check-label text-secondary"
                    >
                        {{ detail }}
                    </label>
                </div>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-sm-6">
                <div>What are your preferred extra mapper details?</div>
                <small class="text-secondary">
                    Select up to 3
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="mapper in mapperOptions" :key="mapper" class="form-check">
                    <input
                        :checked="mapperPreferences.includes(mapper)"
                        :value="mapper"
                        type="checkbox"
                        class="form-check-input"
                        :disabled="(mapperPreferences.length >= 3 && !mapperPreferences.includes(mapper)) || processing"
                        @change="updateMapperPreferences(mapper, $event)"
                    >
                    <label
                        class="form-check-label text-secondary"
                    >
                        {{ mapper }}
                    </label>
                </div>
            </div>
        </div>
    </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import { GenrePreferences, LanguagePreferences, DetailPreferences, MapperPreferences, OsuStylePreferences, TaikoStylePreferences, CatchStylePreferences, ManiaStylePreferences, ManiaKeymodePreferences } from '../../../shared/enums';

export default {
    data () {
        return {
            genrePreferences: [],
            languagePreferences: [],
            osuStylePreferences: [],
            taikoStylePreferences: [],
            catchStylePreferences: [],
            maniaStylePreferences: [],
            maniaKeymodePreferences: [],
            detailPreferences: [],
            mapperPreferences: [],
            genreOptions: GenrePreferences,
            languageOptions: LanguagePreferences,
            osuStyleOptions: OsuStylePreferences,
            taikoStyleOptions: TaikoStylePreferences,
            catchStyleOptions: CatchStylePreferences,
            maniaStyleOptions: ManiaStylePreferences,
            maniaKeymodeOptions: ManiaKeymodePreferences,
            detailOptions: DetailPreferences,
            mapperOptions: MapperPreferences,
            processing: false,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    created () {
        this.genrePreferences = this.loggedInUser.genrePreferences;
        this.languagePreferences = this.loggedInUser.languagePreferences;
        this.osuStylePreferences = this.loggedInUser.osuStylePreferences;
        this.taikoStylePreferences = this.loggedInUser.taikoStylePreferences;
        this.catchStylePreferences = this.loggedInUser.catchStylePreferences;
        this.maniaStylePreferences = this.loggedInUser.maniaStylePreferences;
        this.maniaKeymodePreferences = this.loggedInUser.maniaKeymodePreferences;
        this.detailPreferences = this.loggedInUser.detailPreferences;
        this.mapperPreferences = this.loggedInUser.mapperPreferences;
    },
    methods: {
        async updateGenrePreferences (genre, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateGenrePreferences`, {
                genre,
            }, e);

            this.genrePreferences = data.user.genrePreferences;
            this.processing = false;
        },
        async updateLanguagePreferences (language, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateLanguagePreferences`, {
                language,
            }, e);

            this.languagePreferences = data.user.languagePreferences;
            this.processing = false;
        },
        async updateStylePreferences (style, mode, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateStylePreferences/${mode}`, {
                style,
            }, e);

            this.osuStylePreferences = data.user.osuStylePreferences;
            this.taikoStylePreferences = data.user.taikoStylePreferences;
            this.catchStylePreferences = data.user.catchStylePreferences;
            this.maniaStylePreferences = data.user.maniaStylePreferences;
            this.processing = false;
        },
        async updateKeymodePreferences (keymode, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateKeymodePreferences`, {
                keymode,
            }, e);

            this.maniaKeymodePreferences = data.user.maniaKeymodePreferences;
            this.processing = false;
        },
        async updateDetailPreferences (detail, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateDetailPreferences`, {
                detail,
            }, e);

            this.detailPreferences = data.user.detailPreferences;
            this.processing = false;
        },
        async updateMapperPreferences (mapper, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateMapperPreferences`, {
                mapper,
            }, e);

            this.mapperPreferences = data.user.mapperPreferences;
            this.processing = false;
        },
    },
};
</script>
