<template>
    <section class="card card-body">
        <div class="d-flex align-items-center mb-1">
            <h4 class="mb-0">
                BN Finder
            </h4>
        </div>

        <div class="row container">
            <div class="col-sm-6">
                <div class="row">
                    <div class="input-group">
                        <div class="w-50">
                            <select
                                v-model="genreSelected"
                                class="form-control my-1"
                            >
                                <option value="" disabled>
                                    select a song genre
                                </option>
                                <option v-for="option in genreOptions" :key="option" :value="option">
                                    {{ option }}
                                </option>
                            </select>
                        </div>
                        <div class="input-group-append">
                            <button
                                class="btn btn-sm"
                                :class="genres.includes(genreSelected) ? 'btn-danger' : 'btn-primary'"
                                @click="addGenre()"
                            >
                                {{ genres.includes(genreSelected) ? 'Remove genre' : 'Add genre' }}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="input-group">
                        <div class="w-50">
                            <select
                                v-model="languageSelected"
                                class="form-control my-1"
                            >
                                <option value="" disabled>
                                    select a song language
                                </option>
                                <option v-for="option in languageOptions" :key="option" :value="option">
                                    {{ option }}
                                </option>
                            </select>
                        </div>
                        <div class="input-group-append">
                            <button
                                class="btn btn-sm"
                                :class="languages.includes(languageSelected) ? 'btn-danger' : 'btn-primary'"
                                @click="addLanguage()"
                            >
                                {{ languages.includes(languageSelected) ? 'Remove language' : 'Add language' }}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="input-group">
                        <div class="w-50">
                            <select
                                v-model="styleSelected"
                                class="form-control my-1"
                            >
                                <option value="" disabled>
                                    select a map style
                                </option>
                                <option v-for="option in styleOptions" :key="option" :value="option">
                                    {{ option }}
                                </option>
                            </select>
                        </div>
                        <div class="input-group-append">
                            <button
                                class="btn btn-sm btn-primary"
                                :class="styles.includes(styleSelected) ? 'btn-danger' : 'btn-primary'"
                                @click="addStyle()"
                            >
                                {{ styles.includes(styleSelected) ? 'Remove style' : 'Add style' }}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="input-group">
                        <div class="w-50">
                            <select
                                v-model="detailSelected"
                                class="form-control my-1"
                            >
                                <option value="" disabled>
                                    select a song detail
                                </option>
                                <option v-for="option in detailOptions" :key="option" :value="option">
                                    {{ option }}
                                </option>
                            </select>
                        </div>
                        <div class="input-group-append">
                            <button
                                class="btn btn-sm"
                                :class="details.includes(detailSelected) ? 'btn-danger' : 'btn-primary'"
                                @click="addDetail()"
                            >
                                {{ details.includes(detailSelected) ? 'Remove detail' : 'Add detail' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-sm-6">
                <div class="justify-content-between">
                    Your map details:
                    <ul class="small">
                        <li>Song genre(s): <span class="text-secondary"><span v-if="!genres.length"><i>add some!</i></span><span v-else><b>{{ genres.join(', ') }}</b></span></span></li>
                        <li>Song language(s): <span class="text-secondary"><span v-if="!languages.length"><i>add some!</i></span><span v-else><b>{{ languages.join(', ') }}</b></span></span></li>
                        <li>Map style(s): <span class="text-secondary"><span v-if="!styles.length"><i>add some!</i></span><span v-else><b>{{ styles.join(', ') }}</b></span></span></li>
                        <li>Other detail(s): <span class="text-secondary"><span v-if="!details.length"><i>add some!</i></span><span v-else><b>{{ details.join(', ') }}</b></span></span></li>
                    </ul>
                </div>
                <div class="form-inline mb-3 justify-content-between">
                    <div class="input-group">
                        <input
                            v-model="url"
                            class="form-control"
                            type="text"
                            placeholder="map link"
                            @keyup.enter="submit($event)"
                        >
                        <div class="input-group-append">
                            <button
                                :disabled="!loggedInUser"
                                class="btn btn-sm btn-secondary"
                                data-toggle="tooltip"
                                data-placement="top"
                                :title="loggedInUser ? 'Submit details to find BNs' : 'Authorize above to find BNs'"
                                @click="submit($event)"
                            >
                                Find Beatmap Nominators
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="users.length" class="justify-content-between">
            The following users might be interested in your map:
            <ul class="small">
                <li>dafdsfsf</li>
            </ul>
        </div>
    </section>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'BnFinder',
    components: {},
    data () {
        return {
            url: '',
            genres: [],
            genreOptions: ['rock', 'pop', 'novelty', 'hip hop', 'electronic', 'metal', 'classical', 'folk', 'jazz', 'other'],
            genreSelected: '',
            languages: [],
            languageOptions: ['instrumental', 'english', 'japanese', 'korean', 'chinese', 'other'],
            languageSelected: '',
            styles: [],
            styleOptions: ['simple', 'tech', 'alternating', 'conceptual', 'other'],
            styleSelected: '',
            details: [],
            detailOptions: ['anime', 'game', 'movie', 'tv', 'doujin', 'featured artist', 'cover', 'remix'],
            detailSelected: '',
            users: [],
        };
    },
    computed: mapState([
        'loggedInUser',
    ]),
    methods: {
        addGenre () {
            if (this.genreSelected.length && !this.genres.includes(this.genreSelected)) {
                this.genres.push(this.genreSelected);
                this.genreSelected = '';
            } else if (this.genres.includes(this.genreSelected)) {
                const i = this.genres.indexOf(this.genreSelected);
                this.genres.splice(i,1);
            }
        },
        addLanguage () {
            if (this.languageSelected.length && !this.languages.includes(this.languageSelected)) {
                this.languages.push(this.languageSelected);
                this.languageSelected = '';
            } else if (this.languages.includes(this.languageSelected)) {
                const i = this.languages.indexOf(this.languageSelected);
                this.languages.splice(i,1);
            }
        },
        addStyle () {
            if (this.styleSelected.length && !this.styles.includes(this.styleSelected)) {
                this.styles.push(this.styleSelected);
                this.styleSelected = '';
            } else if (this.styles.includes(this.styleSelected)) {
                const i = this.styles.indexOf(this.styleSelected);
                this.styles.splice(i,1);
            }
        },
        addDetail () {
            if (this.detailSelected.length && !this.details.includes(this.detailSelected)) {
                this.details.push(this.detailSelected);
                this.detailSelected = '';
            } else if (this.details.includes(this.detailSelected)) {
                const i = this.details.indexOf(this.detailSelected);
                this.details.splice(i,1);
            }
        },
        async submit (e) {
            if (!this.url) {
                this.$store.dispatch('updateToastMessages', {
                    message: `Must enter beatmap link`,
                    type: 'danger',
                });

                return;
            }

            const data = await this.$http.executePost(
                '/findBns',
                {
                    url: this.url,
                    genres: this.genres,
                    languages: this.languages,
                    styles: this.styles,
                    details: this.details,
                },
                e
            );

            if (!data.error) {
                this.users = data.users;
            }
        },
    },
};
</script>
