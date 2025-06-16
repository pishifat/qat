<template>
    <div class="container">
        <div class="row">
            <div class="col-sm-6">
                <div>What languages do you speak?</div>
                <small class="text-secondary">
                    Displayed on the home page. Changes are only visible after refreshing
                </small>
            </div>

            <div class="col-sm-6">
                <div class="input-group">
                    <select
                        id="user-languages"
                        v-model="selectedLanguage"
                        class="form-control ml-2"
                    >
                        <option
                            v-for="language in availableLanguages"
                            :key="language"
                            :value="language"
                        >
                            {{ language }}
                        </option>
                    </select>
                    <div class="input-group-append">
                        <button
                            v-if="!userLanguages.includes(selectedLanguage)"
                            class="btn btn-sm btn-outline-success"
                            type="button"
                            @click="updateLanguages($event)"
                            :disabled="userLanguages.includes(selectedLanguage)"
                        >
                            <i class="fas fa-plus" />
                        </button>
                    </div>
                    <div class="input-group-append">
                        <button
                        v-if="userLanguages.includes(selectedLanguage)"
                            class="btn btn-sm btn-outline-danger"
                            type="button"
                            @click="updateLanguages($event)"
                            :disabled="!userLanguages.includes(selectedLanguage)"
                        >
                            <i class="fas fa-minus" />
                        </button>
                    </div>
                </div>
                <span class="small text-secondary">Current languages: {{ userLanguages.length ? userLanguages.join(', ') : 'none' }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import enums from 'shared/enums';
const { Languages } = enums;

export default {
    data () {
        return {
            availableLanguages: Languages,
            userLanguages: [],
            selectedLanguage: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    created () {
        this.userLanguages = [...this.loggedInUser.languages];
    },
    methods: {
        async updateLanguages (e) {
            await this.$http.executePost(`/users/${this.loggedInUser.id}/updateLanguages`, {
                language: this.selectedLanguage,
            }, e);

            const i = this.userLanguages.indexOf(this.selectedLanguage);

            if (i == -1) {
                this.userLanguages.push(this.selectedLanguage);
            } else {
                this.userLanguages.splice(i, 1);
            }
        },
    },
};
</script>
