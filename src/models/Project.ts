import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema({
  name: String,
  type: String,
});

const ModelSchema = new mongoose.Schema({
  name: String,
  fields: [FieldSchema],
});

const RecordSchema = new mongoose.Schema(
  {},
  { strict: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    models: [ModelSchema],
    data: {
      type: Map,
      of: [RecordSchema], // كل Model له Records خاصة فيه
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Project", ProjectSchema);