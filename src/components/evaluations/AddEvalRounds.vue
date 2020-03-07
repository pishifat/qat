<template>
    <div id="addEvalRounds" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-nat-logo">
                    <h5 class="modal-title text-dark">
                        Add BNs to evaluate
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden">
                    <div class="container">
                        <div class="form-check form-check-inline text-shadow">
                            <input
                                id="osu"
                                class="form-check-input"
                                type="checkbox"
                                value="osu"
                            >
                            <label class="form-check-label" for="osu">osu!</label>
                        </div>
                        <div class="form-check form-check-inline text-shadow">
                            <input
                                id="taiko"
                                class="form-check-input"
                                type="checkbox"
                                value="taiko"
                            >
                            <label class="form-check-label" for="taiko">osu!taiko</label>
                        </div>
                        <div class="form-check form-check-inline text-shadow">
                            <input
                                id="catch"
                                class="form-check-input"
                                type="checkbox"
                                value="catch"
                            >
                            <label class="form-check-label" for="catch">osu!catch</label>
                        </div>
                        <div class="form-check form-check-inline text-shadow">
                            <input
                                id="mania"
                                class="form-check-input"
                                type="checkbox"
                                value="mania"
                            >
                            <label class="form-check-label" for="mania">osu!mania</label>
                        </div>

                        <hr>

                        <div class="form-check text-shadow mb-2">
                            <input
                                id="probationBns"
                                class="form-check-input"
                                type="checkbox"
                                value=""
                            >
                            <label class="form-check-label" for="probationBns">
                                Probation BNs
                            </label>
                        </div>
                        <div class="form-check text-shadow mb-2">
                            <input
                                id="fullBns"
                                class="form-check-input"
                                type="checkbox"
                                value=""
                            >
                            <label class="form-check-label" for="fullBns">
                                Full BNs
                            </label>
                        </div>
                        <div class="form-check text-shadow mb-2">
                            <input
                                id="nat"
                                class="form-check-input"
                                type="checkbox"
                                value=""
                            >
                            <label class="form-check-label" for="nat">
                                NAT
                            </label>
                        </div>

                        <hr>

                        <div class="mb-2">
                            <span class="text-shadow">Include specific user(s):</span>
                            <input
                                id="includeUsers"
                                class="ml-1 w-75"
                                type="text"
                                placeholder="username1, username2, username3..."
                            >
                        </div>
                        <div class="mb-2">
                            <span class="text-shadow">Exclude specific user(s):</span>
                            <input
                                id="excludeUsers"
                                class="ml-1 w-75"
                                type="text"
                                placeholder="username1, username2, username3..."
                            >
                        </div>

                        <hr>

                        <div class="mb-2">
                            <span class="text-shadow">Deadline:</span>
                            <input
                                v-model="dateInput"
                                class="ml-1"
                                type="text"
                                placeholder="MM-DD-YYYY"
                                maxlength="10"
                                style="min-width: 125px; width: 125px;"
                            >
                            <button type="submit" class="btn btn-sm btn-nat" @click="setDefaultDate($event)">
                                Set deadline ~2 weeks from now
                            </button>
                            <p class="small pl-2 pt-2">
                                Only deadlines within the next 2 weeks will be displayed
                            </p>
                        </div>
                    </div>

                    <hr>
                    <span id="addEvalRoundsErrors" class="errors text-shadow">{{ info }}</span>
                    <span id="addEvalRoundsConfirm" class="confirm text-shadow">{{ confirm }}</span>
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
    name: 'AddEvalRounds',
    mixins: [postData],
    data() {
        return {
            info: '',
            confirm: '',
            dateInput: '',
        };
    },
    methods: {
        async addEvalRounds(e) {
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

            const dateSplit = this.dateInput.split('-');
            const deadline = new Date(
                parseInt(dateSplit[2], 10),
                parseInt(dateSplit[0], 10) - 1,
                parseInt(dateSplit[1], 10)
            );

            if (!(deadline instanceof Date) || isNaN(deadline)) {
                this.info = 'Invalid Date!';

                return;
            }

            const result = await this.executePost(
                '/bnEval/addEvalRounds/',
                {
                    osu,
                    taiko,
                    catch: ctb,
                    mania,
                    probation,
                    bn,
                    nat,
                    includeUsers,
                    excludeUsers,
                    deadline,
                },
                e
            );

            if (result) {
                if (result.errors) {
                    this.info = result.errors;
                } else {
                    this.$emit('update-all-eval-rounds', result.ers);

                    if (result.ers.length) {
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
                    } else {
                        this.confirm = 'No eval rounds were added! If you were trying to add specific users, re-check your spelling.';
                    }
                }
            }
        },
        setDefaultDate() {
            const date = new Date();
            date.setDate(date.getDate() + 12);
            let month = (date.getMonth() + 1).toString();

            if (month.length == 1) {
                month = '0' + month;
            }

            let day = date.getDate().toString();

            if (day.length == 1) {
                day = '0' + day;
            }

            const year = date.getFullYear();
            this.dateInput = month + '-' + day + '-' + year;
        },
    },
};
</script>

<style>
</style>
