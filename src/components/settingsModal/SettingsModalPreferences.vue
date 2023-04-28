<template>
    <div class="container">
        <!--<div class="row">
            <div class="col-sm-6">
                <div>Do you want to be anonymous when accepting/denying matches?</div>
                <small class="text-secondary">
                    Only relevant to osu! messages
                </small>
            </div>

            <div class="col-sm-6">
                <div class="form-check">
                    <input
                        id="settings-anonymous"
                        :checked="loggedInUser.isBnFinderAnonymous"
                        type="checkbox"
                        class="form-check-input"
                        @change="updateIsBnFinderAnonymous"
                    >
                    <label
                        class="form-check-label text-secondary"
                        for="settings-anonymous"
                    >
                        Anonymous on BN Finder messages
                    </label>
                </div>
            </div>
        </div>
        <hr>-->
        <div class="row">
            <div class="col-sm-6">
                <div>What are your preferred song genres?</div>
                <small class="text-secondary">
                    {{ defaultText }}
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="genre in genreOptions" :key="genre">
                    <i
                        class="fa-check-circle fake-checkbox"
                        :class="[(genrePreferences.length >= 3 && !genrePreferences.includes(genre)) || processing ? 'fake-disabled' : '', genrePreferences.includes(genre) ? 'text-success fas' : 'far']"
                        @click="updateGenrePreferences(genre, true, $event)"
                    />
                    <i
                        class="fa-times-circle fake-checkbox"
                        :class="[processing ? 'fake-disabled' : '', genreNegativePreferences.includes(genre) ? 'text-danger fas' : 'far']"
                        @click="updateGenrePreferences(genre, false, $event)"
                    />
                    <label
                        class="form-check-label text-secondary ml-1"
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
                    {{ defaultText }}
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="language in languageOptions" :key="language">
                    <i
                        class="fa-check-circle fake-checkbox"
                        :class="[(languagePreferences.length >= 3 && !languagePreferences.includes(language)) || processing ? 'fake-disabled' : '', languagePreferences.includes(language) ? 'text-success fas' : 'far']"
                        @click="updateLanguagePreferences(language, true, $event)"
                    />
                    <i
                        class="fa-times-circle fake-checkbox"
                        :class="[processing ? 'fake-disabled' : '', languageNegativePreferences.includes(language) ? 'text-danger fas' : 'far']"
                        @click="updateLanguagePreferences(language, false, $event)"
                    />
                    <label
                        class="form-check-label text-secondary ml-1"
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
                    {{ defaultText }}
                </small>
            </div>

            <div class="col-sm-6">
                <div v-if="loggedInUser.modes.includes('osu')">
                    <div v-for="style in osuStyleOptions" :key="style">
                        <i
                            class="fa-check-circle fake-checkbox"
                            :class="[(osuStylePreferences.length >= 3 && !osuStylePreferences.includes(style)) || processing ? 'fake-disabled' : '', osuStylePreferences.includes(style) ? 'text-success fas' : 'far']"
                            @click="updateStylePreferences(style, true, 'osu', $event)"
                        />
                        <i
                            class="fa-times-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', osuStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far']"
                            @click="updateStylePreferences(style, false, 'osu', $event)"
                        />
                        <label
                            class="form-check-label text-secondary"
                        >
                            {{ style }} <span class="small">(osu!)</span>
                        </label>
                    </div>
                </div>
                <div v-if="loggedInUser.modes.includes('taiko')">
                    <div v-for="style in taikoStyleOptions" :key="style">
                        <i
                            class="fa-check-circle fake-checkbox"
                            :class="[(taikoStylePreferences.length >= 3 && !taikoStylePreferences.includes(style)) || processing ? 'fake-disabled' : '', taikoStylePreferences.includes(style) ? 'text-success fas' : 'far']"
                            @click="updateStylePreferences(style, true, 'taiko', $event)"
                        />
                        <i
                            class="fa-times-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', taikoStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far']"
                            @click="updateStylePreferences(style, false, 'taiko', $event)"
                        />
                        <label
                            class="form-check-label text-secondary"
                        >
                            {{ style }} <span class="small">(osu!taiko)</span>
                        </label>
                    </div>
                </div>
                <div v-if="loggedInUser.modes.includes('catch')">
                    <div v-for="style in catchStyleOptions" :key="style">
                        <i
                            class="fa-check-circle fake-checkbox"
                            :class="[(catchStylePreferences.length >= 3 && !catchStylePreferences.includes(style)) || processing ? 'fake-disabled' : '', catchStylePreferences.includes(style) ? 'text-success fas' : 'far']"
                            @click="updateStylePreferences(style, true, 'catch', $event)"
                        />
                        <i
                            class="fa-times-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', catchStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far']"
                            @click="updateStylePreferences(style, false, 'catch', $event)"
                        />
                        <label
                            class="form-check-label text-secondary"
                        >
                            {{ style }} <span class="small">(osu!catch)</span>
                        </label>
                    </div>
                </div>
                <div v-if="loggedInUser.modes.includes('mania')">
                    <div v-for="style in maniaStyleOptions" :key="style">
                        <i
                            class="fa-check-circle fake-checkbox"
                            :class="[(maniaStylePreferences.length >= 3 && !maniaStylePreferences.includes(style)) || processing ? 'fake-disabled' : '', maniaStylePreferences.includes(style) ? 'text-success fas' : 'far']"
                            @click="updateStylePreferences(style, true, 'mania', $event)"
                        />
                        <i
                            class="fa-times-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', maniaStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far']"
                            @click="updateStylePreferences(style, false, 'mania', $event)"
                        />
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
                    {{ defaultText }}
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="keymode in maniaKeymodeOptions" :key="keymode">
                    <i
                        class="fa-check-circle fake-checkbox"
                        :class="[(maniaKeymodePreferences.length >= 3 && !maniaKeymodePreferences.includes(keymode)) || processing ? 'fake-disabled' : '', maniaKeymodePreferences.includes(keymode) ? 'text-success fas' : 'far']"
                        @click="updateKeymodePreferences(keymode, true, $event)"
                    />
                    <i
                        class="fa-times-circle fake-checkbox"
                        :class="[processing ? 'fake-disabled' : '', maniaKeymodeNegativePreferences.includes(keymode) ? 'text-danger fas' : 'far']"
                        @click="updateKeymodePreferences(keymode, false, $event)"
                    />
                    <label
                        class="form-check-label text-secondary"
                    >
                        {{ keymode }}
                    </label>
                </div>
            </div>
        </div>
        <hr v-if="loggedInUser.modes.includes('mania')">
        <div class="row">
            <div class="col-sm-6">
                <div>What are your preferred extra song details?</div>
                <small class="text-secondary">
                    {{ defaultText }} These refer to song sources or other relevant song details
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="detail in detailOptions" :key="detail">
                    <i
                        class="fa-check-circle fake-checkbox"
                        :class="[(detailPreferences.length >= 3 && !detailPreferences.includes(detail)) || processing ? 'fake-disabled' : '', detailPreferences.includes(detail) ? 'text-success fas' : 'far']"
                        @click="updateDetailPreferences(detail, true, $event)"
                    />
                    <i
                        class="fa-times-circle fake-checkbox"
                        :class="[processing ? 'fake-disabled' : '', detailNegativePreferences.includes(detail) ? 'text-danger fas' : 'far']"
                        @click="updateDetailPreferences(detail, false, $event)"
                    />
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
                    {{ defaultText }}
                </small>
            </div>

            <div class="col-sm-6">
                <div v-for="mapper in mapperOptions" :key="mapper">
                    <i
                        class="fa-check-circle fake-checkbox"
                        :class="[(mapperPreferences.length >= 3 && !mapperPreferences.includes(mapper)) || processing ? 'fake-disabled' : '', mapperPreferences.includes(mapper) ? 'text-success fas' : 'far']"
                        @click="updateMapperPreferences(mapper, true, $event)"
                    />
                    <i
                        class="fa-times-circle fake-checkbox"
                        :class="[processing ? 'fake-disabled' : '', mapperNegativePreferences.includes(mapper) ? 'text-danger fas' : 'far']"
                        @click="updateMapperPreferences(mapper, false, $event)"
                    />
                    <label
                        class="form-check-label text-secondary"
                    >
                        {{ mapper }}
                    </label>
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
            genreNegativePreferences: [],
            languagePreferences: [],
            languageNegativePreferences: [],
            osuStylePreferences: [],
            osuStyleNegativePreferences: [],
            taikoStylePreferences: [],
            taikoStyleNegativePreferences: [],
            catchStylePreferences: [],
            catchStyleNegativePreferences: [],
            maniaStylePreferences: [],
            maniaStyleNegativePreferences: [],
            maniaKeymodePreferences: [],
            maniaKeymodeNegativePreferences: [],
            detailPreferences: [],
            detailNegativePreferences: [],
            mapperPreferences: [],
            mapperNegativePreferences: [],
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
            defaultText: `Select up to 3 preferences. Crossed (red X) options will almost never be recommended to you.`,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    created () {
        this.genrePreferences = this.loggedInUser.genrePreferences;
        this.genreNegativePreferences = this.loggedInUser.genreNegativePreferences;
        this.languagePreferences = this.loggedInUser.languagePreferences;
        this.languageNegativePreferences = this.loggedInUser.languageNegativePreferences;
        this.osuStylePreferences = this.loggedInUser.osuStylePreferences;
        this.osuStyleNegativePreferences = this.loggedInUser.osuStyleNegativePreferences;
        this.taikoStylePreferences = this.loggedInUser.taikoStylePreferences;
        this.taikoStyleNegativePreferences = this.loggedInUser.taikoStyleNegativePreferences;
        this.catchStylePreferences = this.loggedInUser.catchStylePreferences;
        this.catchStyleNegativePreferences = this.loggedInUser.catchStyleNegativePreferences;
        this.maniaStylePreferences = this.loggedInUser.maniaStylePreferences;
        this.maniaStyleNegativePreferences = this.loggedInUser.maniaStyleNegativePreferences;
        this.maniaKeymodePreferences = this.loggedInUser.maniaKeymodePreferences;
        this.maniaKeymodeNegativePreferences = this.loggedInUser.maniaKeymodeNegativePreferences;
        this.detailPreferences = this.loggedInUser.detailPreferences;
        this.detailNegativePreferences = this.loggedInUser.detailNegativePreferences;
        this.mapperPreferences = this.loggedInUser.mapperPreferences;
        this.mapperNegativePreferences = this.loggedInUser.mapperNegativePreferences;
    },
    methods: {
        async updateIsBnFinderAnonymous (e) {
            await this.$http.executePost(`/users/${this.loggedInUser.id}/switchIsBnFinderAnonymous`, {}, e);
        },
        async updateGenrePreferences (genre, isPreference, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateGenrePreferences`, {
                genre,
                isPreference,
            }, e);

            this.genrePreferences = data.user.genrePreferences;
            this.genreNegativePreferences = data.user.genreNegativePreferences;
            this.processing = false;
        },
        async updateLanguagePreferences (language, isPreference, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateLanguagePreferences`, {
                language,
                isPreference,
            }, e);

            this.languagePreferences = data.user.languagePreferences;
            this.languageNegativePreferences = data.user.languageNegativePreferences;
            this.processing = false;
        },
        async updateStylePreferences (style, isPreference, mode, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateStylePreferences/${mode}`, {
                style,
                isPreference,
            }, e);

            this.osuStylePreferences = data.user.osuStylePreferences;
            this.osuStyleNegativePreferences = data.user.osuStyleNegativePreferences;
            this.taikoStylePreferences = data.user.taikoStylePreferences;
            this.taikoStyleNegativePreferences = data.user.taikoStyleNegativePreferences;
            this.catchStylePreferences = data.user.catchStylePreferences;
            this.catchStyleNegativePreferences = data.user.catchStyleNegativePreferences;
            this.maniaStylePreferences = data.user.maniaStylePreferences;
            this.maniaStyleNegativePreferences = data.user.maniaStyleNegativePreferences;
            this.processing = false;
        },
        async updateKeymodePreferences (keymode, isPreference, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateKeymodePreferences`, {
                keymode,
                isPreference,
            }, e);

            this.maniaKeymodePreferences = data.user.maniaKeymodePreferences;
            this.maniaKeymodeNegativePreferences = data.user.maniaKeymodeNegativePreferences;
            this.processing = false;
        },
        async updateDetailPreferences (detail, isPreference, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateDetailPreferences`, {
                detail,
                isPreference,
            }, e);

            this.detailPreferences = data.user.detailPreferences;
            this.detailNegativePreferences = data.user.detailNegativePreferences;
            this.processing = false;
        },
        async updateMapperPreferences (mapper, isPreference, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateMapperPreferences`, {
                mapper,
                isPreference,
            }, e);

            this.mapperPreferences = data.user.mapperPreferences;
            this.mapperNegativePreferences = data.user.mapperNegativePreferences;
            this.processing = false;
        },
    },
};
</script>

<style scoped>

.fake-checkbox:hover {
    cursor: pointer;
    color: lightblue;
    opacity: 0.7;
}

.fake-disabled {
    color: white !important;
    opacity: 0.4 !important;
    cursor: default !important;
    pointer-events: none !important;
}

</style>