import { Document, Model } from 'mongoose'

interface IBeatmapReportDocument extends Document {
    beatmapsetId: number;
    postId: number;
    reporterUserId: number;
}

export default interface IBeatmapReportModel extends Model<IBeatmapReportDocument> { }
