<template>
<div id="addEvalRounds" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-nat-logo">
                <h5 class="modal-title text-dark">Add BNs to evaluate</h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: hidden">
                <div class="container">
                    <div class="form-check form-check-inline text-shadow">
                        <input class="form-check-input" type="checkbox" id="osu" value="osu" />
                        <label class="form-check-label" for="osu">osu!</label>
                    </div>
                    <div class="form-check form-check-inline text-shadow">
                        <input class="form-check-input" type="checkbox" id="taiko" value="taiko" />
                        <label class="form-check-label" for="taiko">osu!taiko</label>
                    </div>
                    <div class="form-check form-check-inline text-shadow">
                        <input class="form-check-input" type="checkbox" id="catch" value="catch" />
                        <label class="form-check-label" for="catch">osu!catch</label>
                    </div>
                    <div class="form-check form-check-inline text-shadow">
                        <input class="form-check-input" type="checkbox" id="mania" value="mania" />
                        <label class="form-check-label" for="mania">osu!mania</label>
                    </div>

                    <hr />

                    <div class="form-check text-shadow mb-2">
                        <input class="form-check-input" type="checkbox" value="" id="probationBns" />
                        <label class="form-check-label" for="probationBns">
                            Probation BNs
                        </label>
                    </div>
                    <div class="form-check text-shadow mb-2">
                        <input class="form-check-input" type="checkbox" value="" id="fullBns" />
                        <label class="form-check-label" for="fullBns">
                            Full BNs
                        </label>
                    </div>
                    <div class="form-check text-shadow mb-2">
                        <input class="form-check-input" type="checkbox" value="" id="nat" />
                        <label class="form-check-label" for="nat">
                            NAT
                        </label>
                    </div>

                    <hr />

                    <div class="mb-2">
                        <span class="text-shadow">Include specific user(s):</span>
                        <input
                            id="includeUsers"
                            class="ml-1 w-75"
                            type="text"
                            placeholder="username1, username2, username3..."
                        />
                    </div>
                    <div class="mb-2">
                        <span class="text-shadow">Exclude specific user(s):</span>
                        <input
                            id="excludeUsers"
                            class="ml-1 w-75"
                            type="text"
                            placeholder="username1, username2, username3..."
                        />
                    </div>

                    <hr />

                    <div class="mb-2">
                        <span class="text-shadow">Deadline:</span>
                        <input
                            id="month"
                            class="ml-1"
                            type="text"
                            placeholder="MM"
                            maxlength="2"
                            style="min-width: 55px; width: 55px;"
                        />
                        <input
                            id="day"
                            type="text"
                            placeholder="DD"
                            maxlength="2"
                            style="min-width: 55px; width: 55px;"
                        />
                        <p class="small pl-2 pt-2">Only deadlines within the next 2 weeks will be displayed</p>
                    </div>
                </div>

                <hr />
                <span class="errors text-shadow" id="addEvalRoundsErrors">{{ info }}</span>
                <span class="confirm text-shadow" id="addEvalRoundsConfirm">{{ confirm }}</span>
                <button type="submit" class="btn btn-nat float-right" @click="addEvalRounds($event)">
                    Add BNs
                </button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'add-eval-rounds',
    mixins: [postData],
    methods: {
        addEvalRounds: async function(e) {
            this.info = '';
            this.confirm = '';

            let osu = $('#osu').is(':checked');
            let taiko = $('#taiko').is(':checked');
            let ctb = $('#catch').is(':checked');
            let mania = $('#mania').is(':checked');
            if (!osu && !taiko && !ctb && !mania) {
                this.info = 'Must select game mode!';
                return;
            }

            let probation = $('#probationBns').is(':checked');
            let bn = $('#fullBns').is(':checked');
            let nat = $('#nat').is(':checked');

            let includeUsers = $('#includeUsers').val();
            let excludeUsers = $('#excludeUsers').val();

            if (!probation && !bn && !nat && !includeUsers) {
                this.info = 'Must select user type or specify the users to be evaluated!';
                return;
            }

            let y = new Date().getFullYear();
            let m = $('#month').val() - 1;
            let d = $('#day').val();
            let deadline = new Date(y, m, d);
            if (!(deadline instanceof Date) || isNaN(deadline) || !m || !d) {
                this.info = 'Invalid Date!';
                return;
            }

            const result = await this.executePost(
                '/bnEval/addEvalRounds/',
                {
                    osu: osu,
                    taiko: taiko,
                    catch: ctb,
                    mania: mania,
                    probation: probation,
                    bn: bn,
                    nat: nat,
                    includeUsers: includeUsers,
                    excludeUsers: excludeUsers,
                    deadline: deadline,
                },
                e
            );
            
            if (result) {
                if (result.errors) {
                    this.info = result.errors;
                } else {
                    this.$emit('update-all-eval-rounds', result.ers);
                    if(result.ers.length){
                        this.confirm = 'Eval rounds added! ';
                        if (result.failed.length) {
                            this.confirm += 'However, the following usernames could not be processed: ';
                            for (let i = 0; i < result.failed.length; i++) {
                                this.confirm += result.failed[i];
                                if (i + 1 != result.failed.length) {
                                    this.confirm += ', ';
                                }
                            }
                        }
                    }else{
                        this.confirm = 'No eval rounds were added! If you were trying to add specific users, re-check your spelling.';
                    }
                }
            }
        },
    },
    data() {
        return {
            info: '',
            confirm: '',
        };
    },
};
</script>

<style>
</style>
