<template>
    <div>
        <hr>
        <p v-if="isLeader" class="min-spacing">
            <button
                class="btn btn-nat-red btn-sm minw-150"
                @click="group == 'bn' ? switchGroup('nat', $event) : switchGroup('bn', $event)"
            >
                {{ group == 'bn' ? 'Move to NAT' : 'Move to BN' }}
            </button>
            <button
                v-if="group == 'nat'"
                class="btn btn-nat-red btn-sm minw-200"
                @click="removeNat();"
            >
                Remove from NAT
            </button>
        </p>
        <p v-else-if="isCurrentUser && group != 'nat'" class="text-shadow min-spacing">
            BN evaluation: 
            <span :class="{ 'vote-fail': !isBnEvaluator, 'vote-pass': isBnEvaluator }">
                {{ isBnEvaluator ? 'active' : 'inactive' }}
            </span>
            <button
                class="btn btn-sm ml-2"
                :class="{ 'btn-nat-green': !isBnEvaluator, 'btn-nat-red': isBnEvaluator }"
                data-toggle="tooltip"
                data-placement="top"
                title="Toggle ability to give input on BN applications"
                @click="switchBnEvaluator($event)"
            >
                {{ isBnEvaluator ? 'Deactivate' : 'Activate' }}
            </button>
        </p>
    </div>
</template>

<script>
import postData from '../../../mixins/postData.js';

export default {
    name: 'footer-buttons',
    props: {
        isLeader: Boolean,
        group: String,
        isBnEvaluator: Boolean,
        isCurrentUser: Boolean,
        userId: String,
    },
    mixins: [postData],
    methods: {
        async switchBnEvaluator(e) {
            const u = await this.executePost('/users/switchBnEvaluator/', {}, e);
            if (u) {
                if (u.error) {
                    this.info = u.error;
                } else {
                    this.$emit('update-user', u);
                }
            }
        },
        async switchGroup(group, e) {
            const result = confirm(
                `Are you sure? This will affect join/leave dates and potentially reveal hidden pages.`
            );
            if (result) {
                const u = await this.executePost('/users/switchGroup/' + this.userId, { group }, e);
                if (u) {
                    if (u.error) {
                        this.info = u.error;
                    } else {
                        this.$emit('update-user', u);
                    }
                }
            }
        },
        async removeNat(e) {
            const result = confirm(
                `Are you sure?`
            );
            if (result) {
                const u = await this.executePost('/users/removeNat/' + userId, {}, e);
                if (u) {
                    if (u.error) {
                        this.info = u.error;
                    } else {
                        this.$emit('update-user', u);
                        $('#extendedInfo').modal('hide');
                    }
                }
            }
        },
    },
};
</script>