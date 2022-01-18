<template>
    <div>
        <div
            v-if="match"
            class="my-2 row no-gutters"
            style="position: relative; height: 250px;"
        >
            <div
                :style="`background-image: url('https://assets.ppy.sh/beatmaps/${match.beatmapset.osuId}/covers/cover.jpg';`"
                class="rounded-top request-row-bg"
            />

            <div class=" request-row-bg-fade" />

            <div class="col-sm-12 text-center">
                <h4 class="mt-3">
                    <a :href="`https://osu.ppy.sh/beatmapsets/${match.beatmapset.osuId}`" target="_blank"><b>{{ match.beatmapset.fullTitle }}</b></a>
                </h4>
                <h5>
                    mapped by
                    <user-link
                        :username="match.beatmapset.mapperUsername"
                        :osu-id="match.beatmapset.mapperOsuId"
                    />
                </h5>
                <div>
                    <audio
                        controls
                    >
                        <source
                            :src="`https://b.ppy.sh/preview/${match.beatmapset.osuId}.mp3`"
                            type="audio/mpeg"
                        >
                    </audio>
                    <div>
                        <span v-if="match.genres && match.genres.length">
                            Genre(s): <b>{{ match.genres.join(', ') }}</b>
                        </span> /
                        <span v-if="match.languages && match.languages.length">
                            Language(s): <b>{{ match.languages.join(', ') }}</b>
                        </span>
                    </div>
                    <div v-if="(match.styles && match.styles.length) || (match.details && match.details.length)">
                        <span v-if="match.styles && match.styles.length">
                            Mapping style(s): <b>{{ match.styles.join(', ') }}</b>
                        </span>
                        <span v-if="match.styles && match.styles.length && match.details && match.details.length">/</span>
                        <span v-if="match.details && match.details.length">
                            Other detail(s): <b>{{ match.styles.join(', ') }}</b>
                        </span>
                    </div>
                </div>
            </div>
            <div class="row col-sm-12">
                <div class="col-sm-3" />
                <h1 class="col-sm-1">
                    <a href="#" @click.prevent="setMatchStatus(match.id, false)">
                        <i
                            class="fas fa-times-circle d-flex flex-row-reverse text-danger"
                            data-toggle="tooltip"
                            data-placement="left"
                            title="notify mapper that you're NOT interested in this map"
                            @mouseover="rejectHover = true"
                            @mouseleave="rejectHover = false"
                        />
                    </a>
                </h1>

                <h3 class="col-sm-4 justify-content-center d-flex" :class="rejectHover ? 'text-danger' : 'text-success'">
                    <b>{{ rejectHover ? 'NEXT MAP' : acceptHover ? 'MATCH' : '' }}</b>
                </h3>

                <h1 class="col-sm-1">
                    <a href="#" @click.prevent="setMatchStatus(match.id, true)">
                        <i
                            class="fas fa-check-circle d-flex flex-row text-success"
                            data-toggle="tooltip"
                            data-placement="right"
                            title="notify mapper that you're interested in this map!"
                            @mouseover="acceptHover = true"
                            @mouseleave="acceptHover = false"
                        />
                    </a>
                </h1>
                <div class="col-sm-3" />
            </div>
        </div>
        <section v-else class="card card-body" style="min-height: 250px;">
            <div class="d-flex align-items-center mb-1">
                <h4 class="mb-0">
                    Your BN Finder Matches
                </h4>
            </div>

            <div class="container">
                <p>When users submit beatmaps above that match your preferences, they'll appear here!</p>
                <p>Your beatmap preferences can be edited from the <b><span class="text-info"><i class="fas fa-cog text-info" /> cog icon</span></b> in the top right. You can select up to 3 preferences per category. For the best results, try to select 3 preferences in every section.</p>
                <p><b><span class="text-success"><i class="fas fa-check-circle" /> Accepting</span></b> or <b><span class="text-danger"><i class="fas fa-times-circle" /> rejecting</span></b> any matches will automatically notify the beatmap's creator.</p>
                <p>Only you can see this section.</p>
                <hr>
                <p>NOBODY CAN SUBMIT MAPS YET. SET YOUR PREFERENCES BEFORE <b>NOVEMBER 19</b> PLEASE THANKS :heart:</p>
            </div>
        </section>
    </div>
</template>

<script>
import UserLink from '../../components/UserLink.vue';

export default {
    name: 'BnFinderMatches',
    components: {
        UserLink,
    },
    data () {
        return {
            match: null,
            rejectHover: false,
            acceptHover: false,
        };
    },
    async created () {
        await this.findNextMatch();
    },
    methods: {
        async findNextMatch () {
            const match = await this.$http.executeGet('/findNextMatch');

            if (match) {
                this.match = match;
            } else {
                this.match = null;
            }
        },
        async setMatchStatus (id, status) {
            const match = await this.$http.executePost(
                '/setMatchStatus/' + id,
                {
                    status,
                }
            );

            this.match = null;

            if (match) {
                this.findNextMatch();
            }
        },
    },
};
</script>

<style>

.request-row-bg {
    width: 100%;
    height: 100%;
    opacity: 0.2;
    background-size: cover;
    position: absolute;
}

.request-row-bg-fade {
    height: 100%;
    width: 100%;
    position: absolute;
    background: linear-gradient(103deg, transparent 60%, #242424 100%);
}

.reject-color {
    color: rgb(141, 43, 43);
}

.accept-color {
    color: rgb(75, 128, 75);
}

</style>