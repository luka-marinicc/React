var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var commentSchema = new Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

var reportSchema = new Schema({
  reason: {
    type: String,
    enum: ["explicit", "spam", "harassment", "other"],
    default: "explicit",
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

var photoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      trim: true,
      default: "",
    },

    path: {
      type: String,
      required: true,
    },

    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    comments: [commentSchema],

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    views: {
      type: Number,
      default: 0,
    },

    reports: [reportSchema],

    status: {
      type: String,
      enum: ["visible", "hidden", "under_review"],
      default: "visible",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("photo", photoSchema);
