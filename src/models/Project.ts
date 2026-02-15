import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  description?: string;
  data: Map<string, any[]>;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String },
    data: {
      type: Map,
      of: [Schema.Types.Mixed],
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>("Project", ProjectSchema);