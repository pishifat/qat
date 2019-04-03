<template>

<div class="row">
    <div class="col-md-12 mb-4">
        <section class="row segment segment-solid my-1 mx-4">
            <small>Search: 
                <input id="search" class="text-input" v-model="filterValue" type="text" placeholder="username... (3+ characters)" /> 
            </small>
            <small>
                <select class="custom-select inline-custom-select ml-2" id="mode" v-model="filterMode">
                    <option value="" selected>All modes</option>
                    <option value="osu">osu!</option>
                    <option value="taiko">osu!taiko</option>
                    <option value="catch">osu!catch</option>
                    <option value="mania">osu!mania</option>
                </select>
            </small> 
            <small>
                <button class="btn btn-nat btn-sm ml-2" @click="selectAll($event)">Select all</button>
            </small>
        </section>
        <section class="row segment segment-solid my-1 mx-4">
            <small>Mark selected as:
                <button class="btn btn-nat btn-sm ml-2" @click="setGroupEval($event)">Group evaluation</button>
            </small>
            <small>
                <button class="btn btn-nat btn-sm ml-2" @click="setIndividualEval($event)">Individual evaluation</button>
            </small>
            <small>
                <button class="btn btn-nat-red btn-sm ml-2" @click="setComplete($event)">Archive</button>
            </small>
        </section>
        <hr>
        <h2>Individual Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="only you can see these">?</sup> 
            <button
                v-if="isBnEval"
                class="btn btn-nat"
                data-toggle="modal"
                data-target="#addEvalRounds"
                @click="openAddEvalRounds()"
            >Add users to evaluate</button>
        </h2>

        <transition-group name="list" tag="div" class="row">
            <eval-card
                v-for="evalRound in evalRounds"
                :eval-round="evalRound"
                :evaluator="evaluator"
                :key="evalRound.id"
                @update:selectedEvalRound="selectedEvalRound = $event"
            ></eval-card>
        </transition-group>
        
        <p v-if="!evalRounds || evalRounds.length == 0" class="ml-4">
            {{ isBnEval ? 'No BNs to evaluate...' : 'No applications to evaluate...' }}
        </p>
    </div>
    
    <div class="col-md-12">
        <hr>
        <h2>Group Evaluations<sup style="font-size: 12pt" data-toggle="tooltip" data-placement="top" title="everyone can see these">?</sup></h2>
        

        <transition-group name="list" tag="div" class="row">
            <discuss-card
                v-for="discussRound in discussRounds"
                :discuss-round="discussRound"
                :evaluator="evaluator"
                :key="discussRound.id"
                @update:selectedDiscussRound="selectedDiscussRound = $event"
            ></discuss-card>
        </transition-group>
        
        <p v-if="!discussRounds || discussRounds.length == 0" class="ml-4">
            {{ isBnEval ? 'No BNs to evaluate...' : 'No applications to evaluate...' }}
        </p>
    </div>
</div>

</template>

<script>
export default {
    name: 'base-eval-page',
    props: {
        isBnEval: {
            type: Boolean,
            default: false,
        },
        
    }
}
</script>