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
                    <div class="container text-shadow">
                        <div class="row">
                            <div class="col-sm-12">
                                <div>
                                    <span class="mr-4">Game mode:</span>
                                    <label
                                        class="mx-1"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="osu!"
                                    >
                                        <input
                                            type="checkbox"
                                            class="osu-radio hide-default"
                                            name="mode"
                                            value="osu"
                                        >
                                        <i class="fas fa-circle fa-lg" />
                                    </label>
                                    <label
                                        class="mx-1"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="osu!taiko"
                                    >
                                        <input
                                            type="checkbox"
                                            class="taiko-radio hide-default"
                                            name="mode"
                                            value="taiko"
                                        >
                                        <i class="fas fa-drum fa-lg" />
                                    </label>
                                    <label
                                        class="mx-1"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="osu!catch"
                                    >
                                        <input
                                            type="checkbox"
                                            class="catch-radio hide-default"
                                            name="mode"
                                            value="catch"
                                        >
                                        <i class="fas fa-apple-alt fa-lg" />
                                    </label>
                                    <label
                                        class="mx-1"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="osu!mania"
                                    >
                                        <input
                                            type="checkbox"
                                            class="mania-radio hide-default"
                                            name="mode"
                                            value="mania"
                                        >
                                        <i class="fas fa-stream fa-lg" />
                                    </label>
                                </div>
                                <p class="small min-spacing ml-2">
                                    Specify mode(s) for evaluations. Multi-mode BNs can generate multiple evaluations.
                                </p>
                            </div>
                            <div class="col-sm-12 mt-3">
                                <div>
                                    <span class="mr-4">User group:</span>
                                    <label
                                        class="mx-2"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="probation BN"
                                    >
                                        <input
                                            type="checkbox"
                                            class="probation-bn-radio hide-default"
                                            name="group"
                                            value="probationBn"
                                        >
                                        <i class="fab fa-accessible-icon" />
                                    </label>
                                    <label
                                        class="mx-2"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="full BN"
                                    >
                                        <input
                                            type="checkbox"
                                            class="full-bn-radio hide-default"
                                            name="group"
                                            value="fullBn"
                                        >
                                        <i class="fas fa-walking" />
                                    </label>
                                    <label
                                        class="mx-2"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="NAT"
                                    >
                                        <input
                                            type="checkbox"
                                            class="nat-radio hide-default"
                                            name="group"
                                            value="nat"
                                        >
                                        <i class="fas fa-running" />
                                    </label>
                                </div>
                                <p class="small min-spacing ml-2">
                                    Generate evaluations for all members of a user group. Only use this if you know what you're doing.
                                </p>
                            </div>
                        </div>

                        <div class="row mt-3">
                            <div class="col-sm-6">
                                Include specific user(s):
                                <input
                                    v-model="includeUsers"
                                    class="ml-2 w-100 small"
                                    type="text"
                                    placeholder="username1, username2, username3..."
                                >
                            </div>
                            <div class="col-sm-6">
                                Exclude specific user(s):
                                <input
                                    v-model="excludeUsers"
                                    class="ml-2 w-100 small"
                                    type="text"
                                    placeholder="username1, username2, username3..."
                                >
                            </div>
                        </div>

                        <div class="mt-3">
                            Deadline:
                            <input
                                v-model="dateInput"
                                class="ml-1 small"
                                type="text"
                                placeholder="MM-DD-YYYY"
                                maxlength="10"
                                style="min-width: 125px; width: 125px;"
                            >
                            <p class="small min-spacing ml-2 mt-1">
                                Only deadlines within the next 2 weeks will be displayed.
                            </p>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-nat mb-2 mt-4 w-100" @click="addEvalRounds($event)">
                        Generate evaluations
                    </button>
                    <span id="addEvalRoundsErrors" class="errors">{{ info }}</span>
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
            includeUsers: null,
            excludeUsers: null,
            dateInput: this.setDefaultDate(),
        };
    },
    methods: {
        async addEvalRounds(e) {
            const confirmInput = confirm(`Are you sure?`);

            if (confirmInput) {
                this.info = '';
                let modes = [];

                $('input[name="mode"]:checked').each(function () {
                    modes.push(this.value);
                });

                if (!modes.length) {
                    this.info = 'Must select game mode!';

                    return;
                }

                let groups = [];

                $('input[name="group"]:checked').each(function () {
                    groups.push(this.value);
                });


                if (!groups.length && !this.includeUsers) {
                    this.info = 'Must select user group or include specific users!';

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
                        modes,
                        groups,
                        includeUsers: this.includeUsers,
                        excludeUsers: this.excludeUsers,
                        deadline,
                    },
                    e
                );

                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.$emit('update-all-eval-rounds', result.ers);

                        if (result.ers.length) {

                            if (result.failed.length) {
                                this.info += 'The following usernames could not be processed: ';

                                for (let i = 0; i < result.failed.length; i++) {
                                    this.info += result.failed[i];

                                    if (i + 1 != result.failed.length) {
                                        this.info += ', ';
                                    }
                                }
                            } else {
                                $('#addEvalRounds').modal('hide');
                            }
                        } else {
                            this.info = 'No eval rounds were added! If you were trying to add specific users, re-check your spelling.';
                        }
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

            return month + '-' + day + '-' + year;
        },
    },
};
</script>

<style>
</style>
