<template>
    <div class="row">
        <div class="col-md-12">
            <section v-if="pages.length" class="card card-body docs-container">
                <!-- introduction link, takes more space than regular docs pages-->
                <router-link
                    to="/docs/Introduction"
                    class="docs-item card w-100"
                >
                    <h3>Introduction</h3>
                    <p class="small text-secondary">
                        Welcome to the NAT!
                    </p>
                </router-link>

                <router-link
                    v-for="page in pages"
                    :key="page.id"
                    :to="'/docs/' + page.slug"
                    class="docs-item card"
                >
                    <h4 class="m-0">
                        {{ page.title }}
                    </h4>
                </router-link>
            </section>

            <section v-else class="card card-body">
                <p>No documentation pages found.</p>
            </section>

            <section v-if="loggedInUser.isNatLeader" class="card card-body">
                <h5>Create page</h5>
                <div>
                    Title:
                    <input
                        v-model="title"
                        class="form-control mb-2"
                        type="text"
                    >
                </div>

                <div>
                    Content:
                    <markdown-editor
                        ref="editor"
                        v-model="content"
                        storage-key="md:docs-new"
                        input-class="form-control-sm"
                        :rows="4"
                    />
                </div>
                <button
                    class="btn btn-primary mt-2"
                    @click="createPage($event)"
                >
                    Create
                </button>
            </section>
        </div>

        <toast-messages />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import ToastMessages from '../components/ToastMessages.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';

export default {
    name: 'DocumentationIndexPage',
    components: {
        ToastMessages,
        MarkdownEditor,
    },
    data() {
        return {
            pages: [],
            title: '',
            content: '',
        };
    },
    computed: {
        ...mapState([
            'loggedInUser',
        ]),
    },
    async created () {
        const pages = await this.$http.initialRequest('/docs');
        this.pages = pages.filter(page => page.slug !== 'Introduction');
    },
    methods: {
        async createPage(e) {
            const article = await this.$http.executePost('/docs/create', {
                title: this.title,
                content: this.content,
            }, e);

            if (this.$http.isValid(article)) {
                this.$refs.editor.clearDraft();
                this.$router.push(`/docs/${article.slug}`);
            }
        },
    },
};
</script>

<style scoped>
.docs-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    flex-direction: row;
}

.docs-item {
    padding: 1rem;
    margin: 5px;
    min-height: 5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: all 0.2s;
    text-decoration: none;
    text-align: center;
    color: inherit;
    width: calc(50% - 10px);
}

.docs-item:hover {
    filter: brightness(90%);
}
</style>
