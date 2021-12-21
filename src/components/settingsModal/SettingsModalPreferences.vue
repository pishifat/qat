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
                <div v-for="style in styleOptions" :key="style" class="form-check">
                    <input
                        :checked="stylePreferences.includes(style)"
                        :value="style"
                        type="checkbox"
                        class="form-check-input"
                        :disabled="(stylePreferences.length >= 3 && !stylePreferences.includes(style)) || processing"
                        @change="updateStylePreferences(style, $event)"
                    >
                    <label
                        class="form-check-label text-secondary"
                    >
                        {{ style }}
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
</template>

<script>
import { mapState } from 'vuex';

export default {
    data () {
        return {
            genrePreferences: [],
            languagePreferences: [],
            stylePreferences: [],
            detailPreferences: [],
            mapperPreferences: [],
            genreOptions: ['rock', 'pop', 'novelty', 'hip hop', 'electronic', 'metal', 'classical', 'folk', 'jazz', 'other'],
            languageOptions: ['instrumental', 'english', 'japanese', 'korean', 'chinese', 'other'],
            styleOptions: ['simple', 'tech', 'alternating', 'conceptual', 'other'],
            detailOptions: ['anime', 'game', 'movie', 'tv', 'doujin', 'featured artist', 'cover', 'remix'],
            mapperOptions: ['new mapper', 'experienced mapper'],
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
        this.stylePreferences = this.loggedInUser.stylePreferences;
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
        async updateStylePreferences (style, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateStylePreferences`, {
                style,
            }, e);

            this.stylePreferences = data.user.stylePreferences;
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
