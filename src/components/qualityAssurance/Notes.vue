<template>
    <div>
        <div class="col-sm-12 pl-2">
            <a href="#" @click.prevent="showInput = !showInput">
                <i class="fas fa-edit" />
            </a>
            <span v-if="!showInput && !userNote">
                ...
            </span>
            <span 
                v-else-if="!showInput"
                class="small text-shadow min-spacing text-white-50"
                v-html="filterLinks(artist.notes)"
            />
            <input
                v-if="showInput"
                v-model="notes"
                class="small w-75"
                rows="4"
                type="text"
                placeholder="enter to submit..."
                style="border-radius: 5px 5px 5px 5px;"
                @keyup.enter="updateNotes($event)"
                @change="updateNotes($event)"
            >
            <!-- "..." before comment exists
            the comment after it exists (computed variable)
            textarea with @change
            -->
        </div>
        <div v-if="qualityAssuranceComments.length" class="col-sm-12">
            <ul>
                <!-- if not maxchecks/outdated/currentuser, show Anoynmous: comment, otherwise show username: comment -->
                <li v-for="comment in qualityAssuranceComments" :key="comment.id" class="small">
                    {{ comment.mediator.username }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';

export default {
    name: 'Notes',
    mixins: [postData],
    props: {
        qualityAssuranceComments: {
            type: Array,
            default() {
                return [];
            },
        },
        userId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            info: '',
            showInput: false,
            userNote: null,
        };
    },
    computed: {
        userNote() {
            for (let i = 0; i < this.qualityAssuranceComments.length; i++) {
                const comment = this.qualityAssuranceComments[i];
                
                if (comment.mediator.id == this.userId) {
                    return comment
                }
            }
        },
    },
    created() {
        for (let i = 0; i < this.qualityAssuranceComments.length; i++) {
            const comment = this.qualityAssuranceComments[i];
            
            if (comment.mediator.id == this.userId) {
                return comment
            }
        }
    }
    methods: {
        async editNote () {
            // create or update note
            // everything below this is irrelevant
            this.forceDisabled = true;
            const qualityAssuranceCheckers = await this.executePost('/qualityAssurance/assignUser/' + this.eventId, {});

            if (qualityAssuranceCheckers) {
                if (qualityAssuranceCheckers.error) {
                    this.info = qualityAssuranceCheckers.error;
                } else {
                    this.$emit('update-quality-assurance-checkers', { id: this.eventId, value: qualityAssuranceCheckers });
                }

                this.forceDisabled = false;
            }
        },
    },
};
</script>

