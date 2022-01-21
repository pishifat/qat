<template>
    <section class="card card-body">
        <div class="d-flex align-items-center mb-1">
            <h4 class="mb-0">
                BN Finder
            </h4>
        </div>
        <p>Having trouble finding a Beatmap Nominator to mod your map? Submit your map info below.</p>
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
                                    select genre
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
                                    select language
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
                        <div class="w-25">
                            <select
                                v-model="styleSelected"
                                class="form-control my-1"
                            >
                                <option value="" disabled>
                                    select style
                                </option>
                                <option v-for="option in filteredStyles" :key="option" :value="option">
                                    {{ option }}
                                </option>

                                <option v-if="selectedMode == 'mania'" disabled>
                                    ---
                                </option>
                                <option
                                    v-for="option in maniaKeymodeOptions"
                                    v-if="selectedMode == 'mania'"
                                    :key="option"
                                    :value="option"
                                >
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
                        <mode-radio-display
                            v-model="selectedMode"
                            class="small mt-2 d-flex justify-content-between"
                        />
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
                                    select detail
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

        <div v-if="users.length" class="justify-content-between mt-4">
            The following users might be interested in your map:
            <ul>
                <li v-for="user in users" :key="user.id">
                    <user-link
                        :username="user.username"
                        :osu-id="user.osuId"
                    />
                    <span v-if="user.requestStatus && !user.requestStatus.includes('closed')">
                        <span
                            class="badge badge-pill mx-1 text-lowercase badge-success"
                        >open
                        </span>
                    </span>
                </li>
            </ul>
            <p>Your map will be shown to each of these BNs (if they use the match finding system & this is your first time submitting the map). If your map is accepted or rejected, you'll be notified by <a href="https://osu.ppy.sh/users/23648635" target="_blank">the mappersguild chat bot</a>.</p>
            <p>For a faster response, try reaching out to some of these users directly.</p>
            <p class="small text-secondary">
                Note: This is a work-in-progress! The matching formula will change with time. :)
            </p>
        </div>
    </section>
</template>

<script>
import { mapState } from 'vuex';
import evaluations from '../../mixins/evaluations';
import UserLink from '../../components/UserLink.vue';
import ModeRadioDisplay from '../ModeRadioDisplay.vue';
import { GenrePreferences, LanguagePreferences, DetailPreferences, OsuStylePreferences, TaikoStylePreferences, CatchStylePreferences, ManiaStylePreferences, ManiaKeymodePreferences } from '../../../shared/enums';

export default {
    name: 'BnFinder',
    components: {
        UserLink,
        ModeRadioDisplay,
    },
    mixins: [evaluations],
    data () {
        return {
            url: '',
            genres: [],
            genreOptions: GenrePreferences,
            genreSelected: '',
            languages: [],
            languageOptions: LanguagePreferences,
            languageSelected: '',
            styles: [],
            osuStyleOptions: OsuStylePreferences,
            taikoStyleOptions: TaikoStylePreferences,
            catchStyleOptions: CatchStylePreferences,
            maniaStyleOptions: ManiaStylePreferences,
            maniaKeymodeOptions: ManiaKeymodePreferences,
            styleSelected: '',
            details: [],
            detailOptions: DetailPreferences,
            detailSelected: '',
            users: [],
            selectedMode: 'osu',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        /** @returns {Array} */
        filteredStyles() {
            switch (this.selectedMode) {
                case 'osu':
                    return this.osuStyleOptions;
                case 'taiko':
                    return this.taikoStyleOptions;
                case 'catch':
                    return this.catchStyleOptions;
                case 'mania':
                    return this.maniaStyleOptions;
                default:
                    return this.osuStyleOptions;
            }
        },
    },
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
                this.users = data;
            }
        },
    },
};
</script>
