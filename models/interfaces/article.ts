import { Document, Model,DocumentQuery } from 'mongoose'

export interface IArticleDocument extends Document {
    type: 'documentation'; // enum for when/if we want to reuse articles
    title: string;
    content: string;

    // statics
    slug: string;
}

export interface IArticleModel extends Model<IArticleDocument> {
    findByTitle?: (title: string) => DocumentQuery<IArticleDocument, IArticleDocument>;
}
