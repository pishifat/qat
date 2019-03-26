<template>
    <div class="row">
        <div class="col-md-12">
            <div class="mb-3">
                <small
                    >Search:
                    <input
                        id="search"
                        class="text-input text-input ml-1"
                        v-model="filterValue"
                        type="text"
                        placeholder="beatmap..."
                    />
                </small>
                <small class="ml-1">
                    <select class="custom-select inline-custom-select" id="mode" v-model="filterMode">
                        <option class="ml-2" value="" selected>All modes</option>
                        <option class="ml-2" value="osu">osu!</option>
                        <option class="ml-2" value="taiko">osu!taiko</option>
                        <option class="ml-2" value="catch">osu!catch</option>
                        <option class="ml-2" value="mania">osu!mania</option>
                    </select>
                </small>
                <button class="btn btn-sm btn-qat ml-1" data-toggle="modal" data-target="#addVeto">
                    Submit veto
                </button>
            </div>

            <button
                :disabled="!(pre > 0)"
                class="btn btn-sm btn-qat mx-auto my-2"
                style="display:block"
                type="button"
                @click="showNewer()"
            >
                <i class="fas fa-angle-up mr-1"></i> show next <i class="fas fa-angle-up ml-1"></i>
            </button>
            <transition-group name="list" tag="div" class="row">
                <veto-card
                    v-for="veto in pageObjs"
                    :key="veto.id"
                    :veto="veto"
                    :userId="userId"
                    :userGroup="userGroup"
                    :filterMode="filterMode"
                    @update:selectedVeto="selectedVeto = $event"
                ></veto-card>
            </transition-group>
            <div class="small text-center mx-auto">{{ currentPage }} of {{ pages }}</div>
            <button
                :disabled="!canShowOlder"
                class="btn btn-sm btn-qat mx-auto my-2"
                style="display:block"
                type="button"
                @click="showOlder()"
            >
                <i class="fas fa-angle-down mr-1"></i> show previous <i class="fas fa-angle-down ml-1"></i>
            </button>
        </div>
        <veto-info
            :veto="selectedVeto"
            :user-id="userId"
            :user-group="userGroup"
            :isMediator="isMediator"
            @update-veto="updateVeto($event)"
        ></veto-info>
        <submit-veto @submit-veto="SubmitVeto($event)"></submit-veto>
    </div>
</template>

<script>
import VetoCard from '../components/vetoes/VetoCard.vue';
import VetoInfo from '../components/vetoes/VetoInfo.vue';
import SubmitVeto from '../components/vetoes/SubmitVeto.vue';
import pagination from '../mixins/pagination.js';
import filters from '../mixins/filters.js';

export default {
    name: 'vetoes-page',
    components: {
        VetoCard,
        VetoInfo,
        SubmitVeto,
    },
    mixins: [pagination, filters],
    methods: {
        filterBySearchValueContext: function() {
            //something with bm
            if (this.filterValue != '1111') {
                return true;
            } else {
                return false;
            }
        },
        SubmitVeto: function(v) {
            this.allObjs.push(v);
            this.filter();
        },
        updateVeto: function(v) {
            const i = this.allObjs.findIndex(veto => veto.id == v.id);
            this.allObjs[i] = v;
            this.selectedVeto = v;
            this.filter();
        },
    },
    data() {
        return {
            allObjs: null,
            pageObjs: null,
            filteredObjs: null,
            userId: null,
            userGroup: null,
            selectedVeto: null,
            isMediator: null,
        };
    },
    created() {
        axios
            .get('/qat/vetoes/relevantInfo')
            .then(response => {
                this.allObjs = response.data.vetoes;
                this.userId = response.data.userId;
                this.userGroup = response.data.userGroup;
                this.isMediator = response.data.isMediator;
                this.limit = 16;
            })
            .then(function() {
                $('#loading').fadeOut();
                $('#main')
                    .attr('style', 'visibility: visible')
                    .hide()
                    .fadeIn();
            });
    },
    mounted() {
        setInterval(() => {
            axios.get('/qat/vetoes/relevantInfo').then(response => {
                this.allObjs = response.data.vetoes;
                if (this.isFiltered) {
                    this.filter();
                }
            });
        }, 300000);
    },
};
</script>

<style>
</style>
