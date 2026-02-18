<template>
    <div class="row">
        <div class="col-md-12">
            <section v-if="loggedInUser.isNat && isEditing" class="card card-body">
                <div>
                    Title:
                    <input
                        v-model="article.title"
                        class="form-control mb-2"
                        type="text"
                    >
                </div>
                <div>
                    Content:
                    <span class="small text-secondary">(It's recommended to use an external markdown editor for larger edits.)</span>
                    <textarea
                        v-model="article.content"
                        class="form-control form-control-sm"
                        type="text"
                        :rows="Math.min(article.content.split('\n').length + 1, 20)"
                    />
                </div>
                <span class="small text-secondary my-1">
                    Last updated: {{ toRelativeDate(article.updatedAt) }} ({{ toStandardDetailedDate(article.updatedAt) }})
                </span>
                <div class="d-flex align-items-center">
                    <button
                        class="btn btn-secondary"
                        @click="edit($event)"
                    >
                        Update
                    </button>
                    <button
                        class="btn btn-primary mx-2"
                        @click="disableEdit()"
                    >
                        Cancel
                    </button>
                </div>
            </section>

            <section class="card card-body v-html-content">
                <div class="d-flex align-items-center">
                    <span class="title-text">{{ article.title }}</span>
                    <a
                        v-if="loggedInUser.isNat"
                        href="#"
                        class="ms-2"
                        @click.prevent="isEditing = !isEditing"
                    >
                        <i class="fas fa-edit" />
                    </a>
                </div>
                <hr class="mt-1 mb-3">
                <span v-html="$md.render(article.content)" />
                <toast-messages />
            </section>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';

export default {
    name: 'DocumentationPage',
    components: {
        ToastMessages,
    },
    data() {
        return {
            article: {
                title: '',
                content: '',
            },
            originalArticle: {
                title: '',
                content: '',
            },
            isEditing: false,
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    async created () {
        const article = await this.$http.initialRequest('/docs/' + this.$route.params.slug);

        if (!this.$http.isValid(article)) {
            this.$router.push('/docs');

            return;
        }

        this.article = article;
        this.originalArticle = JSON.parse(JSON.stringify(article));

        document.title = article.title + ' · Documentation';
    },
    methods: {
        disableEdit() {
            this.isEditing = false;
            this.article.title = this.originalArticle.title;
            this.article.content = this.originalArticle.content;

        },
        async edit(e) {
            const res = await this.$http.executePost('/docs/' + this.$route.params.slug + '/edit', {
                title: this.article.title,
                content: this.article.content,
            }, e);

            if (this.$http.isValid(res)) {
                this.originalArticle = JSON.parse(JSON.stringify(this.article));
                this.isEditing = false;
                this.$router.push(`/docs/${res.slug}`);

                this.$toast.success('Updated successfully!');
            }
        },
    },
};
</script>

<style scoped>
/* title */
.title-text {
    font-size: 30px;
    font-weight: 600;
}

/* headers */
:deep(h1) {
    border-bottom: 1px solid rgba(211, 211, 211, 0.25);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    font-weight: 600;
    font-size: 30px;
}
:deep(h2) {
    margin: 2rem 0 1rem;
    border-bottom: 1px solid rgba(211, 211, 211, 0.25);
    padding-bottom: 0.5rem;
    font-weight: 600;
    font-size: 24px;
}
:deep(h3) {
    margin: 2rem 0 1rem;
    font-size: 20px;
}
:deep(h4) {
    margin: 2rem 0 1rem;
    font-size: 16px;
}

/* tables */
:deep(table) {
    border-collapse: collapse;
    margin: 2rem 0;
}
:deep(thead tr) {
    border-bottom: 2px solid rgba(124, 151, 165, 0.2);
}
:deep(thead tr th) {
    background-color: var(--bs-bright-blue-gray);
    border-color: rgba(124, 151, 165, 0.2);
    padding: 5px 10px;
}
:deep(tbody tr) {
    border-bottom: 1px solid rgba(211, 211, 211, 0.15);
}
:deep(tbody tr:last-child) {
    border-bottom: none;
}
:deep(tbody tr td) {
    padding: 5px;
}

/* center images that are the only child of a p element */
:deep(p > img:only-child) {
    display: block;
    margin: 0 auto;
}

/* align other images to the left */
:deep(img) {
    display: inline-block;
    margin: 0;
    padding: 5px;
}

/* list elements */
:deep(li) {
    padding: 2px 0;
}
</style>
