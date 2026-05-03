var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var viewSchema = new Schema(
  {
    photo: {
      type: Schema.Types.ObjectId,
      ref: "photo",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

viewSchema.index({ photo: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("view", viewSchema);
