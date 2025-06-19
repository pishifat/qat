<template>
    <!-- to whoever reading this file, i'm sorry, but game is game -->
    <div class="container">
        <div class="row">
            <div class="col-sm-4 mb-4">
                <h6>Genre preferences</h6>

                <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                    <div v-for="genre in genreOptions" :key="genre">
                        <i
                            class="fa-check-circle fake-checkbox"
                            :class ="[processing ? 'fake-disabled' : '', genrePreferences.includes(genre) ? 'text-success fas' : 'far']"
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
                    
                    <!-- Custom genre preferences -->
                    <div>
                        <div v-for="genre in customGenrePreferences" :key="genre">
                            <i
                                v-if="genre.startsWith('NOT ')"
                                class="fa-times-circle text-danger fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomGenre(genre, $event) : null"
                            />
                            <i
                                v-else
                                class="fa-check-circle text-success fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomGenre(genre, $event) : null"
                            />
                            <label class="form-check-label text-secondary ml-1">
                                {{ genre.startsWith('NOT ') ? genre.substring(4) : genre }}
                            </label>
                            <i
                                v-if="loggedInUser && (loggedInUser._id === selectedUser.id || loggedInUser.groups.includes('nat') || loggedInUser.groups.includes('gmt'))"
                                class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                                :class="[processing ? 'fake-disabled' : '']"
                                @click="removeCustomGenre(genre, $event)"
                                title="Remove custom genre"
                            />
                        </div>
                        <div class="d-flex mt-2">
                            <input 
                                v-model="customGenreInput"
                                type="text" 
                                class="form-control form-control-sm" 
                                placeholder="Add custom genre..."
                                @keyup.enter="addCustomGenre"
                            />
                            <button 
                                class="btn btn-outline-success btn-sm ml-2" 
                                type="button" 
                                @click="addCustomGenre"
                                :disabled="!customGenreInput.trim() || processing"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else>
                    <div v-for="genre in genreOptions" :key="genre">
                        <i
                            v-if="genrePreferences.includes(genre)"
                            class="fa-check-circle"
                            :class ="genrePreferences.includes(genre) ? 'text-success fas' : 'far'"
                        />
                        <i
                            v-else-if="genreNegativePreferences.includes(genre)"
                            class="fa-times-circle"
                            :class="genreNegativePreferences.includes(genre) ? 'text-danger fas' : 'far'"
                        />
                        <label
                            v-if="genrePreferences.includes(genre) || genreNegativePreferences.includes(genre)"
                            class="form-check-label text-secondary ml-1"
                        >
                            {{ genre }}
                        </label>
                    </div>
                    <!-- Display custom genres for other users -->
                    <div v-for="genre in customGenrePreferences" :key="genre">
                        <i
                            v-if="genre.startsWith('NOT ')"
                            class="fa-times-circle text-danger fas"
                        />
                        <i
                            v-else
                            class="fa-check-circle text-success fas"
                        />
                        <label class="form-check-label text-secondary ml-1">
                            {{ genre.startsWith('NOT ') ? genre.substring(4) : genre }}
                        </label>
                        <i
                            v-if="loggedInUser && (loggedInUser.groups.includes('nat') || loggedInUser.groups.includes('gmt'))"
                            class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                            :class="[processing ? 'fake-disabled' : '']"
                            @click="removeCustomGenre(genre, $event)"
                            title="Remove custom genre"
                        />
                    </div>
                    <small
                        v-if="!genrePreferences.length && !genreNegativePreferences.length && !customGenrePreferences.length"
                        class="text-secondary ml-1"
                    >
                    None...
                    </small>
                </div>
            </div>
            <div class="col-sm-4 mb-4">
                <h6>Language preferences</h6>

                <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                    <div v-for="language in languageOptions" :key="language">
                        <i
                            class="fa-check-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', languagePreferences.includes(language) ? 'text-success fas' : 'far']"
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
                    
                    <!-- Custom language preferences -->
                    <div>
                        <div v-for="language in customLanguagePreferences" :key="language">
                            <i
                                v-if="language.startsWith('NOT ')"
                                class="fa-times-circle text-danger fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomLanguage(language, $event) : null"
                            />
                            <i
                                v-else
                                class="fa-check-circle text-success fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomLanguage(language, $event) : null"
                            />
                            <label class="form-check-label text-secondary ml-1">
                                {{ language.startsWith('NOT ') ? language.substring(4) : language }}
                            </label>
                            <i
                                v-if="loggedInUser && (loggedInUser._id === selectedUser.id || loggedInUser.groups.includes('nat') || loggedInUser.groups.includes('gmt'))"
                                class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                                :class="[processing ? 'fake-disabled' : '']"
                                @click="removeCustomLanguage(language, $event)"
                                title="Remove custom language"
                            />
                        </div>
                        <div class="d-flex mt-2">
                            <input 
                                v-model="customLanguageInput"
                                type="text" 
                                class="form-control form-control-sm" 
                                placeholder="Add custom language..."
                                @keyup.enter="addCustomLanguage"
                            />
                            <button 
                                class="btn btn-outline-success btn-sm ml-2" 
                                type="button" 
                                @click="addCustomLanguage"
                                :disabled="!customLanguageInput.trim() || processing"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else>
                    <div v-for="language in languageOptions" :key="language">
                        <i
                            v-if="languagePreferences.includes(language)"
                            class="fa-check-circle"
                            :class ="languagePreferences.includes(language) ? 'text-success fas' : 'far'"
                        />
                        <i
                            v-else-if="languageNegativePreferences.includes(language)"
                            class="fa-times-circle"
                            :class="languageNegativePreferences.includes(language) ? 'text-danger fas' : 'far'"
                        />
                        <label
                            v-if="languagePreferences.includes(language) || languageNegativePreferences.includes(language)"
                            class="form-check-label text-secondary ml-1"
                        >
                            {{ language }}
                        </label>
                    </div>
                    <!-- Display custom languages for other users -->
                    <div v-for="language in customLanguagePreferences" :key="language">
                        <i
                            v-if="language.startsWith('NOT ')"
                            class="fa-times-circle text-danger fas"
                        />
                        <i
                            v-else
                            class="fa-check-circle text-success fas"
                        />
                        <label class="form-check-label text-secondary ml-1">
                            {{ language.startsWith('NOT ') ? language.substring(4) : language }}
                        </label>
                        <i
                            v-if="loggedInUser && (loggedInUser.groups.includes('nat') || loggedInUser.groups.includes('gmt'))"
                            class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                            :class="[processing ? 'fake-disabled' : '']"
                            @click="removeCustomLanguage(language, $event)"
                            title="Remove custom language"
                        />
                    </div>
                    <small
                        v-if="!languagePreferences.length && !languageNegativePreferences.length && !customLanguagePreferences.length"
                        class="text-secondary ml-1"
                    >
                    None...
                    </small>
                </div>
            </div>
            <div class="col-sm-4 mb-4">
                <h6>Map preferences</h6>

                <div v-if="modes.includes('osu')">
                    <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                        <div v-for="style in osuStyleOptions" :key="style">
                            <i
                                class="fa-check-circle fake-checkbox"
                                :class="[processing ? 'fake-disabled' : '', osuStylePreferences.includes(style) ? 'text-success fas' : 'far']"
                                @click="updateStylePreferences(style, true, 'osu', $event)"
                            />
                            <i
                                class="fa-times-circle fake-checkbox"
                                :class="[processing ? 'fake-disabled' : '', osuStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far']"
                                @click="updateStylePreferences(style, false, 'osu', $event)"
                            />
                            <label
                                class="form-check-label text-secondary ml-1"
                            >
                                {{ style }} <span class="small">(osu!)</span>
                            </label>
                        </div>
                    </div>
                    <div v-else>
                        <div v-for="style in osuStyleOptions" :key="style">
                            <i
                                v-if="osuStylePreferences.includes(style)"
                                class="fa-check-circle"
                                :class ="osuStylePreferences.includes(style) ? 'text-success fas' : 'far'"
                            />
                            <i
                                v-else-if="osuStyleNegativePreferences.includes(style)"
                                class="fa-times-circle"
                                :class="osuStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far'"
                            />
                            <label
                                v-if="osuStylePreferences.includes(style) || osuStyleNegativePreferences.includes(style)"
                                class="form-check-label text-secondary ml-1"
                            >
                                {{ style }} <span class="small">(osu!)</span>
                            </label>
                        </div>
                        <small
                            v-if="!osuStylePreferences.length && !osuStyleNegativePreferences.length && !customMapPreferences.length"
                            class="text-secondary ml-1"
                        >
                        None... {{ modes.length > 1 ? '(osu!)' : '' }}
                        </small>
                    </div>
                </div>
                <div v-if="modes.includes('taiko')">
                    <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                        <div v-for="style in taikoStyleOptions" :key="style">
                            <i
                                class="fa-check-circle fake-checkbox"
                                :class="[processing ? 'fake-disabled' : '', taikoStylePreferences.includes(style) ? 'text-success fas' : 'far']"
                                @click="updateStylePreferences(style, true, 'taiko', $event)"
                            />
                            <i
                                class="fa-times-circle fake-checkbox"
                                :class="[processing ? 'fake-disabled' : '', taikoStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far']"
                                @click="updateStylePreferences(style, false, 'taiko', $event)"
                            />
                            <label
                                class="form-check-label text-secondary ml-1"
                            >
                                {{ style }} <span class="small">(osu!taiko)</span>
                            </label>
                        </div>
                    </div>
                    <div v-else>
                        <div v-for="style in taikoStyleOptions" :key="style">
                            <i
                                v-if="taikoStylePreferences.includes(style)"
                                class="fa-check-circle"
                                :class ="taikoStylePreferences.includes(style) ? 'text-success fas' : 'far'"
                            />
                            <i
                                v-else-if="taikoStyleNegativePreferences.includes(style)"
                                class="fa-times-circle"
                                :class="taikoStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far'"
                            />
                            <label
                                v-if="taikoStylePreferences.includes(style) || taikoStyleNegativePreferences.includes(style)"
                                class="form-check-label text-secondary ml-1"
                            >
                                {{ style }} <span class="small">(osu!taiko)</span>
                            </label>
                        </div>
                        <small
                            v-if="!taikoStylePreferences.length && !taikoStyleNegativePreferences.length && !customMapPreferences.length"
                            class="text-secondary ml-1"
                        >
                        None... {{ modes.length > 1 ? '(osu!taiko)' : '' }}
                        </small>
                    </div>
                </div>
                <div v-if="modes.includes('catch')">
                    <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                        <div v-for="style in catchStyleOptions" :key="style">
                            <i
                                class="fa-check-circle fake-checkbox"
                                :class="[processing ? 'fake-disabled' : '', catchStylePreferences.includes(style) ? 'text-success fas' : 'far']"
                                @click="updateStylePreferences(style, true, 'catch', $event)"
                            />
                            <i
                                class="fa-times-circle fake-checkbox"
                                :class="[processing ? 'fake-disabled' : '', catchStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far']"
                                @click="updateStylePreferences(style, false, 'catch', $event)"
                            />
                            <label
                                class="form-check-label text-secondary ml-1"
                            >
                                {{ style }} <span class="small">(osu!catch)</span>
                            </label>
                        </div>
                    </div>
                    <div v-else>
                        <div v-for="style in catchStyleOptions" :key="style">
                            <i
                                v-if="catchStylePreferences.includes(style)"
                                class="fa-check-circle"
                                :class ="catchStylePreferences.includes(style) ? 'text-success fas' : 'far'"
                            />
                            <i
                                v-else-if="catchStyleNegativePreferences.includes(style)"
                                class="fa-times-circle"
                                :class="catchStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far'"
                            />
                            <label
                                v-if="catchStylePreferences.includes(style) || catchStyleNegativePreferences.includes(style)"
                                class="form-check-label text-secondary ml-1"
                            >
                                {{ style }} <span class="small">(osu!catch)</span>
                            </label>
                        </div>
                        <small
                            v-if="!catchStylePreferences.length && !catchStyleNegativePreferences.length && !customMapPreferences.length"
                            class="text-secondary ml-1"
                        >
                        None... {{ modes.length > 1 ? '(osu!catch)' : '' }}
                        </small>
                    </div>
                </div>
                <div v-if="modes.includes('mania')">
                    <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                        <div v-for="style in maniaStyleOptions" :key="style">
                            <i
                                class="fa-check-circle fake-checkbox"
                                :class="[processing ? 'fake-disabled' : '', maniaStylePreferences.includes(style) ? 'text-success fas' : 'far']"
                                @click="updateStylePreferences(style, true, 'mania', $event)"
                            />
                            <i
                                class="fa-times-circle fake-checkbox"
                                :class="[processing ? 'fake-disabled' : '', maniaStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far']"
                                @click="updateStylePreferences(style, false, 'mania', $event)"
                            />
                            <label
                                class="form-check-label text-secondary ml-1"
                            >
                                {{ style }} <span class="small">(osu!mania)</span>
                            </label>
                        </div>
                    </div>
                    <div v-else>
                        <div v-for="style in maniaStyleOptions" :key="style">
                            <i
                                v-if="maniaStylePreferences.includes(style)"
                                class="fa-check-circle"
                                :class ="maniaStylePreferences.includes(style) ? 'text-success fas' : 'far'"
                            />
                            <i
                                v-else-if="maniaStyleNegativePreferences.includes(style)"
                                class="fa-times-circle"
                                :class="maniaStyleNegativePreferences.includes(style) ? 'text-danger fas' : 'far'"
                            />
                            <label
                                v-if="maniaStylePreferences.includes(style) || maniaStyleNegativePreferences.includes(style)"
                                class="form-check-label text-secondary ml-1"
                            >
                                {{ style }} <span class="small">(osu!mania)</span>
                            </label>
                        </div>
                        <small
                            v-if="!maniaStylePreferences.length && !maniaStyleNegativePreferences.length && !customMapPreferences.length"
                            class="text-secondary ml-1"
                        >
                        None... {{ modes.length > 1 ? '(osu!mania)' : '' }}
                        </small>
                    </div>
                </div>
                
                <!-- Custom map preferences -->
                <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                    <div>
                        <div v-for="map in customMapPreferences" :key="map">
                            <i
                                v-if="map.startsWith('NOT ')"
                                class="fa-times-circle text-danger fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomMap(map, $event) : null"
                            />
                            <i
                                v-else
                                class="fa-check-circle text-success fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomMap(map, $event) : null"
                            />
                            <label class="form-check-label text-secondary ml-1">
                                {{ map.startsWith('NOT ') ? map.substring(4) : map }}
                            </label>
                            <i
                                v-if="loggedInUser && (loggedInUser._id === selectedUser.id || loggedInUser.hasFullReadAccess)"
                                class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                                :class="[processing ? 'fake-disabled' : '']"
                                @click="removeCustomMap(map, $event)"
                                title="Remove custom map preference"
                            />
                        </div>
                        <div class="d-flex mt-2">
                            <input 
                                v-model="customMapInput"
                                type="text" 
                                class="form-control form-control-sm" 
                                placeholder="Add custom map preference..."
                                @keyup.enter="addCustomMap"
                            />
                            <button 
                                class="btn btn-outline-success btn-sm ml-2" 
                                type="button" 
                                @click="addCustomMap"
                                :disabled="!customMapInput.trim() || processing"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else>
                    <!-- Display custom map preferences for other users -->
                    <div v-for="map in customMapPreferences" :key="map">
                        <i
                            v-if="map.startsWith('NOT ')"
                            class="fa-times-circle text-danger fas"
                        />
                        <i
                            v-else
                            class="fa-check-circle text-success fas"
                        />
                        <label class="form-check-label text-secondary ml-1">
                            {{ map.startsWith('NOT ') ? map.substring(4) : map }}
                        </label>
                        <i
                            v-if="loggedInUser && loggedInUser.hasFullReadAccess"
                            class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                            :class="[processing ? 'fake-disabled' : '']"
                            @click="removeCustomMap(map, $event)"
                            title="Remove custom map preference"
                        />
                    </div>
                </div>
            </div>
            <div v-if="modes.includes('mania')" class="col-sm-4 mb-4">
                <h6>Keymode preferences</h6>

                
                <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                    <div v-for="keymode in maniaKeymodeOptions" :key="keymode">
                        <i
                            class="fa-check-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', maniaKeymodePreferences.includes(keymode) ? 'text-success fas' : 'far']"
                            @click="updateKeymodePreferences(keymode, true, $event)"
                        />
                        <i
                            class="fa-times-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', maniaKeymodeNegativePreferences.includes(keymode) ? 'text-danger fas' : 'far']"
                            @click="updateKeymodePreferences(keymode, false, $event)"
                        />
                        <label
                            class="form-check-label text-secondary ml-1"
                        >
                            {{ keymode }}
                        </label>
                    </div>
                </div>
                <div v-else>
                    <div v-for="keymode in maniaKeymodeOptions" :key="keymode">
                        <i
                            v-if="maniaKeymodePreferences.includes(keymode)"
                            class="fa-check-circle"
                            :class ="maniaKeymodePreferences.includes(keymode) ? 'text-success fas' : 'far'"
                        />
                        <i
                            v-else-if="maniaKeymodeNegativePreferences.includes(keymode)"
                            class="fa-times-circle"
                            :class="maniaKeymodeNegativePreferences.includes(keymode) ? 'text-danger fas' : 'far'"
                        />
                        <label
                            v-if="maniaKeymodePreferences.includes(keymode) || maniaKeymodeNegativePreferences.includes(keymode)"
                            class="form-check-label text-secondary ml-1"
                        >
                            {{ keymode }}
                        </label>
                    </div>
                    <small
                        v-if="!maniaKeymodePreferences.length && !maniaKeymodeNegativePreferences.length"
                        class="text-secondary ml-1"
                    >
                    None...
                    </small>
                </div>
            </div>
            <div class="col-sm-4 mb-4">
                <h6>Song details preferences</h6>

                <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                    <div v-for="detail in detailOptions" :key="detail">
                        <i
                            class="fa-check-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', detailPreferences.includes(detail) ? 'text-success fas' : 'far']"
                            @click="updateDetailPreferences(detail, true, $event)"
                        />
                        <i
                            class="fa-times-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', detailNegativePreferences.includes(detail) ? 'text-danger fas' : 'far']"
                            @click="updateDetailPreferences(detail, false, $event)"
                        />
                        <label
                            class="form-check-label text-secondary ml-1"
                        >
                            {{ detail }}
                        </label>
                    </div>
                    
                    <!-- Custom detail preferences -->
                    <div>
                        <div v-for="detail in customDetailPreferences" :key="detail">
                            <i
                                v-if="detail.startsWith('NOT ')"
                                class="fa-times-circle text-danger fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomDetail(detail, $event) : null"
                            />
                            <i
                                v-else
                                class="fa-check-circle text-success fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomDetail(detail, $event) : null"
                            />
                            <label class="form-check-label text-secondary ml-1">
                                {{ detail.startsWith('NOT ') ? detail.substring(4) : detail }}
                            </label>
                            <i
                                v-if="loggedInUser && (loggedInUser._id === selectedUser.id || loggedInUser.hasFullReadAccess)"
                                class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                                :class="[processing ? 'fake-disabled' : '']"
                                @click="removeCustomDetail(detail, $event)"
                                title="Remove custom detail preference"
                            />
                        </div>
                        <div class="d-flex mt-2">
                            <input 
                                v-model="customDetailInput"
                                type="text" 
                                class="form-control form-control-sm" 
                                placeholder="Add custom detail preference..."
                                @keyup.enter="addCustomDetail"
                            />
                            <button 
                                class="btn btn-outline-success btn-sm ml-2" 
                                type="button" 
                                @click="addCustomDetail"
                                :disabled="!customDetailInput.trim() || processing"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            <div v-else>
                <div v-for="detail in detailOptions" :key="detail">
                    <i
                        v-if="detailPreferences.includes(detail)"
                        class="fa-check-circle"
                        :class ="detailPreferences.includes(detail) ? 'text-success fas' : 'far'"
                    />
                    <i
                        v-else-if="detailNegativePreferences.includes(detail)"
                        class="fa-times-circle"
                        :class="detailNegativePreferences.includes(detail) ? 'text-danger fas' : 'far'"
                    />
                    <label
                        v-if="detailPreferences.includes(detail) || detailNegativePreferences.includes(detail)"
                        class="form-check-label text-secondary ml-1"
                    >
                        {{ detail }}
                    </label>
                </div>
                <!-- Display custom detail preferences for other users -->
                <div v-for="detail in customDetailPreferences" :key="detail">
                    <i
                        v-if="detail.startsWith('NOT ')"
                        class="fa-times-circle text-danger fas"
                    />
                    <i
                        v-else
                        class="fa-check-circle text-success fas"
                    />
                    <label class="form-check-label text-secondary ml-1">
                        {{ detail.startsWith('NOT ') ? detail.substring(4) : detail }}
                    </label>
                    <i
                        v-if="loggedInUser && loggedInUser.hasFullReadAccess"
                        class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                        :class="[processing ? 'fake-disabled' : '']"
                        @click="removeCustomDetail(detail, $event)"
                        title="Remove custom detail preference"
                    />
                </div>
                <small
                    v-if="!detailPreferences.length && !detailNegativePreferences.length && !customDetailPreferences.length"
                    class="text-secondary ml-1"
                >
                None...
                </small>
            </div>
        </div>

        <div class="col-sm-4 mb-4">
                <h6>Mapper preferences</h6>

                <div v-if="loggedInUser && loggedInUser._id === selectedUser.id">
                    <div v-for="mapper in mapperOptions" :key="mapper">
                        <i
                            class="fa-check-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', mapperPreferences.includes(mapper) ? 'text-success fas' : 'far']"
                            @click="updateMapperPreferences(mapper, true, $event)"
                        />
                        <i
                            class="fa-times-circle fake-checkbox"
                            :class="[processing ? 'fake-disabled' : '', mapperNegativePreferences.includes(mapper) ? 'text-danger fas' : 'far']"
                            @click="updateMapperPreferences(mapper, false, $event)"
                        />
                        <label
                            class="form-check-label text-secondary ml-1"
                        >
                            {{ mapper }}
                        </label>
                    </div>
                    
                    <!-- Custom mapper preferences -->
                    <div>
                        <div v-for="mapper in customMapperPreferences" :key="mapper">
                            <i
                                v-if="mapper.startsWith('NOT ')"
                                class="fa-times-circle text-danger fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomMapper(mapper, $event) : null"
                            />
                            <i
                                v-else
                                class="fa-check-circle text-success fas"
                                :class="[loggedInUser && loggedInUser._id === selectedUser.id ? 'fake-checkbox' : '', processing ? 'fake-disabled' : '']"
                                @click="loggedInUser && loggedInUser._id === selectedUser.id ? removeCustomMapper(mapper, $event) : null"
                            />
                            <label class="form-check-label text-secondary ml-1">
                                {{ mapper.startsWith('NOT ') ? mapper.substring(4) : mapper }}
                            </label>
                            <i
                                v-if="loggedInUser && (loggedInUser._id === selectedUser.id || loggedInUser.hasFullReadAccess)"
                                class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                                :class="[processing ? 'fake-disabled' : '']"
                                @click="removeCustomMapper(mapper, $event)"
                                title="Remove custom mapper preference"
                            />
                        </div>
                        <div class="d-flex mt-2">
                            <input 
                                v-model="customMapperInput"
                                type="text" 
                                class="form-control form-control-sm" 
                                placeholder="Add custom mapper preference..."
                                @keyup.enter="addCustomMapper"
                            />
                            <button 
                                class="btn btn-outline-success btn-sm ml-2" 
                                type="button" 
                                @click="addCustomMapper"
                                :disabled="!customMapperInput.trim() || processing"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            <div v-else>
                <div v-for="mapper in mapperOptions" :key="mapper">
                    <i
                        v-if="mapperPreferences.includes(mapper)"
                        class="fa-check-circle"
                        :class ="mapperPreferences.includes(mapper) ? 'text-success fas' : 'far'"
                    />
                    <i
                        v-else-if="mapperNegativePreferences.includes(mapper)"
                        class="fa-times-circle"
                        :class="mapperNegativePreferences.includes(mapper) ? 'text-danger fas' : 'far'"
                    />
                    <label
                        v-if="mapperPreferences.includes(mapper) || mapperNegativePreferences.includes(mapper)"
                        class="form-check-label text-secondary ml-1"
                    >
                        {{ mapper }}
                    </label>
                </div>
                <!-- Display custom mapper preferences for other users -->
                <div v-for="mapper in customMapperPreferences" :key="mapper">
                    <i
                        v-if="mapper.startsWith('NOT ')"
                        class="fa-times-circle text-danger fas"
                    />
                    <i
                        v-else
                        class="fa-check-circle text-success fas"
                    />
                    <label class="form-check-label text-secondary ml-1">
                        {{ mapper.startsWith('NOT ') ? mapper.substring(4) : mapper }}
                    </label>
                    <i
                        v-if="loggedInUser && loggedInUser.hasFullReadAccess"
                        class="fas fa-trash fa-sm ml-2 fake-checkbox text-danger"
                        :class="[processing ? 'fake-disabled' : '']"
                        @click="removeCustomMapper(mapper, $event)"
                        title="Remove custom mapper preference"
                    />
                </div>
                <small
                    v-if="!mapperPreferences.length && !mapperNegativePreferences.length && !customMapperPreferences.length"
                    class="text-secondary ml-1"
                >
                None...
                </small>
            </div>
        </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import enums from 'shared/enums';
const { GenrePreferences, LanguagePreferences, DetailPreferences, MapperPreferences, OsuStylePreferences, TaikoStylePreferences, CatchStylePreferences, ManiaStylePreferences, ManiaKeymodePreferences } = enums;

export default {
    name: 'Preferences',
    data () {
        return {
            genrePreferences: [],
            genreNegativePreferences: [],
            customGenrePreferences: [],
            customGenreInput: '',
            languagePreferences: [],
            languageNegativePreferences: [],
            customLanguagePreferences: [],
            customLanguageInput: '',
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
            customDetailPreferences: [],
            customDetailInput: '',
            mapperPreferences: [],
            mapperNegativePreferences: [],
            customMapperPreferences: [],
            customMapperInput: '',
            customMapPreferences: [],
            customMapInput: '',
            genreOptions: GenrePreferences,
            languageOptions: LanguagePreferences,
            osuStyleOptions: OsuStylePreferences,
            taikoStyleOptions: TaikoStylePreferences,
            catchStyleOptions: CatchStylePreferences,
            maniaStyleOptions: ManiaStylePreferences,
            maniaKeymodeOptions: ManiaKeymodePreferences,
            detailOptions: DetailPreferences,
            mapperOptions: MapperPreferences,
            modes: ['osu'],
            processing: false,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
        ...mapGetters('usersHome', [
            'selectedUser',
        ]),
    },
    watch: {
        selectedUser() {
            this.genrePreferences = this.selectedUser.genrePreferences;
            this.genreNegativePreferences = this.selectedUser.genreNegativePreferences;
            this.customGenrePreferences = this.selectedUser.customGenrePreferences || [];
            this.languagePreferences = this.selectedUser.languagePreferences;
            this.languageNegativePreferences = this.selectedUser.languageNegativePreferences;
            this.customLanguagePreferences = this.selectedUser.customLanguagePreferences || [];
            this.osuStylePreferences = this.selectedUser.osuStylePreferences;
            this.osuStyleNegativePreferences = this.selectedUser.osuStyleNegativePreferences;
            this.taikoStylePreferences = this.selectedUser.taikoStylePreferences;
            this.taikoStyleNegativePreferences = this.selectedUser.taikoStyleNegativePreferences;
            this.catchStylePreferences = this.selectedUser.catchStylePreferences;
            this.catchStyleNegativePreferences = this.selectedUser.catchStyleNegativePreferences;
            this.maniaStylePreferences = this.selectedUser.maniaStylePreferences;
            this.maniaStyleNegativePreferences = this.selectedUser.maniaStyleNegativePreferences;
            this.maniaKeymodePreferences = this.selectedUser.maniaKeymodePreferences;
            this.maniaKeymodeNegativePreferences = this.selectedUser.maniaKeymodeNegativePreferences;
            this.detailPreferences = this.selectedUser.detailPreferences;
            this.detailNegativePreferences = this.selectedUser.detailNegativePreferences;
            this.customDetailPreferences = this.selectedUser.customDetailPreferences || [];
            this.mapperPreferences = this.selectedUser.mapperPreferences;
            this.mapperNegativePreferences = this.selectedUser.mapperNegativePreferences;
            this.customMapperPreferences = this.selectedUser.customMapperPreferences || [];
            this.customMapPreferences = this.selectedUser.customMapPreferences || [];
            this.modes = this.getModes();
        },
    },
    mounted () {
        this.genrePreferences = this.selectedUser.genrePreferences;
        this.genreNegativePreferences = this.selectedUser.genreNegativePreferences;
        this.customGenrePreferences = this.selectedUser.customGenrePreferences || [];
        this.languagePreferences = this.selectedUser.languagePreferences;
        this.languageNegativePreferences = this.selectedUser.languageNegativePreferences;
        this.customLanguagePreferences = this.selectedUser.customLanguagePreferences || [];
        this.osuStylePreferences = this.selectedUser.osuStylePreferences;
        this.osuStyleNegativePreferences = this.selectedUser.osuStyleNegativePreferences;
        this.taikoStylePreferences = this.selectedUser.taikoStylePreferences;
        this.taikoStyleNegativePreferences = this.selectedUser.taikoStyleNegativePreferences;
        this.catchStylePreferences = this.selectedUser.catchStylePreferences;
        this.catchStyleNegativePreferences = this.selectedUser.catchStyleNegativePreferences;
        this.maniaStylePreferences = this.selectedUser.maniaStylePreferences;
        this.maniaStyleNegativePreferences = this.selectedUser.maniaStyleNegativePreferences;
        this.maniaKeymodePreferences = this.selectedUser.maniaKeymodePreferences;
        this.maniaKeymodeNegativePreferences = this.selectedUser.maniaKeymodeNegativePreferences;
        this.detailPreferences = this.selectedUser.detailPreferences;
        this.detailNegativePreferences = this.selectedUser.detailNegativePreferences;
        this.customDetailPreferences = this.selectedUser.customDetailPreferences || [];
        this.mapperPreferences = this.selectedUser.mapperPreferences;
        this.mapperNegativePreferences = this.selectedUser.mapperNegativePreferences;
        this.customMapperPreferences = this.selectedUser.customMapperPreferences || [];
        this.customMapPreferences = this.selectedUser.customMapPreferences || [];
        this.modes = this.getModes();
    },
    methods: {
        getModes () {
            if (this.selectedUser.mode == 'none') {
                return [this.selectedUser.history[this.selectedUser.history.length - 1].mode];
            } else {
                return this.selectedUser.modesInfo.map(m => m.mode);
            }
        },
        async updateGenrePreferences (genre, isPreference, e) {
            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateGenrePreferences`, {
                genre,
                isPreference,
            }, e);

            this.genrePreferences = data.user.genrePreferences;
            this.genreNegativePreferences = data.user.genreNegativePreferences;

            let user = this.selectedUser;
            user.genrePreferences = data.user.genrePreferences;
            user.genreNegativePreferences = data.user.genreNegativePreferences;
            this.$store.commit('usersHome/updateUser', user);

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

            let user = this.selectedUser;
            user.languagePreferences = data.user.languagePreferences;
            user.languageNegativePreferences = data.user.languageNegativePreferences;
            this.$store.commit('usersHome/updateUser', user);

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

            let user = this.selectedUser;
            user.osuStylePreferences = data.user.osuStylePreferences;
            user.osuStyleNegativePreferences = data.user.osuStyleNegativePreferences;
            user.taikoStylePreferences = data.user.taikoStylePreferences;
            user.taikoStyleNegativePreferences = data.user.taikoStyleNegativePreferences;
            user.catchStylePreferences = data.user.catchStylePreferences;
            user.catchStyleNegativePreferences = data.user.catchStyleNegativePreferences;
            user.maniaStylePreferences = data.user.maniaStylePreferences;
            user.maniaStyleNegativePreferences = data.user.maniaStyleNegativePreferences;
            this.$store.commit('usersHome/updateUser', user);

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

            let user = this.selectedUser;
            user.maniaKeymodePreferences = data.user.maniaKeymodePreferences;
            user.maniaKeymodeNegativePreferences = data.user.maniaKeymodeNegativePreferences;
            this.$store.commit('usersHome/updateUser', user);

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

            let user = this.selectedUser;
            user.detailPreferences = data.user.detailPreferences;
            user.detailNegativePreferences = data.user.detailNegativePreferences;
            this.$store.commit('usersHome/updateUser', user);

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

            let user = this.selectedUser;
            user.mapperPreferences = data.user.mapperPreferences;
            user.mapperNegativePreferences = data.user.mapperNegativePreferences;
            this.$store.commit('usersHome/updateUser', user);
            
            this.processing = false;
        },
        addCustomGenre() {
            const genre = this.customGenreInput.trim();
            if (!genre || this.customGenrePreferences.includes(genre)) {
                this.customGenreInput = '';
                return;
            }
            this.updateCustomGenrePreferences(genre);
            this.customGenreInput = '';
        },
        async updateCustomGenrePreferences(genre, e) {
            this.processing = true;
            try {
                const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateCustomGenrePreferences`, {
                    genre,
                }, e);

                this.customGenrePreferences = data.user.customGenrePreferences || [];

                let user = this.selectedUser;
                user.customGenrePreferences = data.user.customGenrePreferences || [];
                this.$store.commit('usersHome/updateUser', user);
            } finally {
                this.processing = false;
            }
        },
        async removeCustomGenre(genre, e) {
            // Show confirm dialog for moderators removing other users' preferences
            if (this.loggedInUser._id !== this.selectedUser.id && this.loggedInUser.hasFullReadAccess) {
                const result = confirm(`Are you sure?`);
                if (!result) return;
            }

            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.selectedUser.id}/removeCustomGenre`, {
                genre,
            }, e);

            this.customGenrePreferences = data.user.customGenrePreferences || [];

            let user = this.selectedUser;
            user.customGenrePreferences = data.user.customGenrePreferences || [];
            this.$store.commit('usersHome/updateUser', user);

            this.processing = false;
        },
        addCustomLanguage() {
            const language = this.customLanguageInput.trim();
            if (!language || this.customLanguagePreferences.includes(language)) {
                this.customLanguageInput = '';
                return;
            }
            this.updateCustomLanguagePreferences(language);
            this.customLanguageInput = '';
        },
        async updateCustomLanguagePreferences(language, e) {
            this.processing = true;
            try {
                const data = await this.$http.executePost(`/users/${this.loggedInUser.id}/updateCustomLanguagePreferences`, {
                    language,
                }, e);

                this.customLanguagePreferences = data.user.customLanguagePreferences || [];

                let user = this.selectedUser;
                user.customLanguagePreferences = data.user.customLanguagePreferences || [];
                this.$store.commit('usersHome/updateUser', user);
            } finally {
                this.processing = false;
            }
        },
        async removeCustomLanguage(language, e) {
            // Show confirm dialog for moderators removing other users' preferences
            if (this.loggedInUser._id !== this.selectedUser.id && this.loggedInUser.hasFullReadAccess) {
                const result = confirm(`Are you sure?`);
                if (!result) return;
            }

            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.selectedUser.id}/removeCustomLanguage`, {
                language,
            }, e);

            this.customLanguagePreferences = data.user.customLanguagePreferences || [];

            let user = this.selectedUser;
            user.customLanguagePreferences = data.user.customLanguagePreferences || [];
            this.$store.commit('usersHome/updateUser', user);

            this.processing = false;
        },
        addCustomMap() {
            const map = this.customMapInput.trim();
            if (!map || this.customMapPreferences.includes(map)) {
                this.customMapInput = '';
                return;
            }
            this.updateCustomMapPreferences(map);
            this.customMapInput = '';
        },
        async updateCustomMapPreferences(map, e) {
            this.processing = true;
            try {
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/updateCustomMapPreferences`, {
                    map,
                }, e);

                this.customMapPreferences = data.user.customMapPreferences || [];

                let user = this.selectedUser;
                user.customMapPreferences = data.user.customMapPreferences || [];
                this.$store.commit('usersHome/updateUser', user);
            } finally {
                this.processing = false;
            }
        },
        async removeCustomMap(map, e) {
            // Show confirm dialog for moderators removing other users' preferences
            if (this.loggedInUser._id !== this.selectedUser.id && this.loggedInUser.hasFullReadAccess) {
                const result = confirm(`Are you sure?`);
                if (!result) return;
            }

            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.selectedUser.id}/removeCustomMap`, {
                map,
            }, e);

            this.customMapPreferences = data.user.customMapPreferences || [];

            let user = this.selectedUser;
            user.customMapPreferences = data.user.customMapPreferences || [];
            this.$store.commit('usersHome/updateUser', user);

            this.processing = false;
        },
        addCustomDetail() {
            const detail = this.customDetailInput.trim();
            if (!detail || this.customDetailPreferences.includes(detail)) {
                this.customDetailInput = '';
                return;
            }
            this.updateCustomDetailPreferences(detail);
            this.customDetailInput = '';
        },
        async updateCustomDetailPreferences(detail, e) {
            this.processing = true;
            try {
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/updateCustomDetailPreferences`, {
                    detail,
                }, e);

                this.customDetailPreferences = data.user.customDetailPreferences || [];

                let user = this.selectedUser;
                user.customDetailPreferences = data.user.customDetailPreferences || [];
                this.$store.commit('usersHome/updateUser', user);
            } finally {
                this.processing = false;
            }
        },
        async removeCustomDetail(detail, e) {
            // Show confirm dialog for moderators removing other users' preferences
            if (this.loggedInUser._id !== this.selectedUser.id && this.loggedInUser.hasFullReadAccess) {
                const result = confirm(`Are you sure?`);
                if (!result) return;
            }

            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.selectedUser.id}/removeCustomDetail`, {
                detail,
            }, e);

            this.customDetailPreferences = data.user.customDetailPreferences || [];

            let user = this.selectedUser;
            user.customDetailPreferences = data.user.customDetailPreferences || [];
            this.$store.commit('usersHome/updateUser', user);

            this.processing = false;
        },
        addCustomMapper() {
            const mapper = this.customMapperInput.trim();
            if (!mapper || this.customMapperPreferences.includes(mapper)) {
                this.customMapperInput = '';
                return;
            }
            this.updateCustomMapperPreferences(mapper);
            this.customMapperInput = '';
        },
        async updateCustomMapperPreferences(mapper, e) {
            this.processing = true;
            try {
                const data = await this.$http.executePost(`/users/${this.selectedUser.id}/updateCustomMapperPreferences`, {
                    mapper,
                }, e);

                this.customMapperPreferences = data.user.customMapperPreferences || [];

                let user = this.selectedUser;
                user.customMapperPreferences = data.user.customMapperPreferences || [];
                this.$store.commit('usersHome/updateUser', user);
            } finally {
                this.processing = false;
            }
        },
        async removeCustomMapper(mapper, e) {
            // Show confirm dialog for moderators removing other users' preferences
            if (this.loggedInUser._id !== this.selectedUser.id && this.loggedInUser.hasFullReadAccess) {
                const result = confirm(`Are you sure?`);
                if (!result) return;
            }

            this.processing = true;
            const data = await this.$http.executePost(`/users/${this.selectedUser.id}/removeCustomMapper`, {
                mapper,
            }, e);

            this.customMapperPreferences = data.user.customMapperPreferences || [];

            let user = this.selectedUser;
            user.customMapperPreferences = data.user.customMapperPreferences || [];
            this.$store.commit('usersHome/updateUser', user);

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
