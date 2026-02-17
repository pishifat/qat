const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    type: { type: String, default: 'documentation', enum: ['documentation'] }, // enum for when/if we want to reuse articles
    title: { type: String },
    content: { type: String },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

class ArticleService extends mongoose.Model {
    get slug() {
        return this.title.replace(/ /g, '_');
    }

    static findByTitle(title) {
        const parsedTitle = title.toLowerCase().replace(/_/g, ' ');

        return Article.findOne({
            type: 'documentation',
            $or: [
                { title: new RegExp(`^${parsedTitle}$`, 'i') }, // case-insensitive
            ],
        });
    }
}

articleSchema.loadClass(ArticleService);

/**
 * @type {import('./interfaces/article').IArticleModel}
 */
const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
