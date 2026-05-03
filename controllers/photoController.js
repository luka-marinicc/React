var decay = require("decay");
var PhotoModel = require("../models/photoModel.js");
var ViewModel = require("../models/viewModel.js");

module.exports = {
  list: function (req, res) {
    PhotoModel.find({ status: "visible" })
      .sort({ createdAt: -1 })
      .populate("postedBy")
      .populate("comments.postedBy")
      .exec(function (err, photos) {
        if (err) {
          return res.status(500).json({
            message: "Error when getting photo.",
            error: err,
          });
        }

        return res.json(photos);
      });
  },

  show: async function (req, res) {
    try {
      var id = req.params.id;

      var photo = await PhotoModel.findOne({ _id: id })
        .populate("postedBy")
        .populate("comments.postedBy")
        .populate("likes")
        .populate("reports.reportedBy");

      if (!photo) {
        return res.status(404).json({
          message: "No such photo",
        });
      }

      if (photo.status === "hidden") {
        return res.status(403).json({
          message: "Photo is hidden",
        });
      }

      if (req.session && req.session.userId) {
        try {
          await ViewModel.create({
            photo: photo._id,
            user: req.session.userId,
          });

          photo.views += 1;
          await photo.save();
        } catch (err) {
          if (err.code !== 11000) {
            return res.status(500).json({
              message: "Error when saving view.",
              error: err,
            });
          }
        }
      }

      return res.json(photo);
    } catch (err) {
      return res.status(500).json({
        message: "Error when getting photo.",
        error: err,
      });
    }
  },

  create: function (req, res) {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    var photo = new PhotoModel({
      title: req.body.title,
      content: req.body.content,
      path: "/images/" + req.file.filename,
      postedBy: req.session.userId,
    });

    photo.save(function (err, photo) {
      if (err) {
        return res.status(500).json({
          message: "Error when creating photo",
          error: err,
        });
      }

      return res.status(201).json(photo);
    });
  },

  update: function (req, res) {
    var id = req.params.id;

    PhotoModel.findOne({ _id: id }, function (err, photo) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting photo",
          error: err,
        });
      }

      if (!photo) {
        return res.status(404).json({
          message: "No such photo",
        });
      }

      photo.title = req.body.title ? req.body.title : photo.title;
      photo.content = req.body.content ? req.body.content : photo.content;
      photo.path = req.body.path ? req.body.path : photo.path;
      photo.status = req.body.status ? req.body.status : photo.status;

      photo.save(function (err, photo) {
        if (err) {
          return res.status(500).json({
            message: "Error when updating photo.",
            error: err,
          });
        }

        return res.json(photo);
      });
    });
  },

  remove: function (req, res) {
    var id = req.params.id;

    PhotoModel.findByIdAndRemove(id, function (err, photo) {
      if (err) {
        return res.status(500).json({
          message: "Error when deleting the photo.",
          error: err,
        });
      }

      return res.status(204).json();
    });
  },

  addComment: function (req, res) {
    var id = req.params.id;

    PhotoModel.findOne({ _id: id }, function (err, photo) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting photo.",
          error: err,
        });
      }

      if (!photo) {
        return res.status(404).json({
          message: "No such photo",
        });
      }

      photo.comments.push({
        content: req.body.content,
        postedBy: req.session.userId,
      });

      photo.save(function (err, photo) {
        if (err) {
          return res.status(500).json({
            message: "Error when adding comment.",
            error: err,
          });
        }

        return res.status(201).json(photo);
      });
    });
  },

  like: function (req, res) {
    var id = req.params.id;
    var userId = req.session.userId;

    PhotoModel.findOne({ _id: id }, function (err, photo) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting photo.",
          error: err,
        });
      }

      if (!photo) {
        return res.status(404).json({
          message: "No such photo",
        });
      }

      if (!photo.likes.includes(userId)) {
        photo.likes.push(userId);
      }

      photo.save(function (err, photo) {
        if (err) {
          return res.status(500).json({
            message: "Error when liking photo.",
            error: err,
          });
        }

        return res.json(photo);
      });
    });
  },

  unlike: function (req, res) {
    var id = req.params.id;
    var userId = req.session.userId;

    PhotoModel.findOne({ _id: id }, function (err, photo) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting photo.",
          error: err,
        });
      }

      if (!photo) {
        return res.status(404).json({
          message: "No such photo",
        });
      }

      photo.likes = photo.likes.filter(function (likeUserId) {
        return likeUserId.toString() !== userId.toString();
      });

      photo.save(function (err, photo) {
        if (err) {
          return res.status(500).json({
            message: "Error when unliking photo.",
            error: err,
          });
        }

        return res.json(photo);
      });
    });
  },

  report: function (req, res) {
    var id = req.params.id;
    var userId = req.session.userId;

    PhotoModel.findOne({ _id: id }, function (err, photo) {
      if (err) {
        return res.status(500).json({
          message: "Error when getting photo.",
          error: err,
        });
      }

      if (!photo) {
        return res.status(404).json({
          message: "No such photo",
        });
      }

      var alreadyReported = photo.reports.some(function (report) {
        return report.reportedBy.toString() === userId.toString();
      });

      if (!alreadyReported) {
        photo.reports.push({
          reason: req.body.reason || "explicit",
          reportedBy: userId,
        });
      }

      if (photo.reports.length >= 2) {
        photo.status = "hidden";
      }

      photo.save(function (err, photo) {
        if (err) {
          return res.status(500).json({
            message: "Error when reporting photo.",
            error: err,
          });
        }

        return res.json(photo);
      });
    });
  },

  publish: function (req, res) {
    return res.render("photo/publish");
  },

  hot: function (req, res) {
    var hotScore = decay.redditHot(45000);

    PhotoModel.find({ status: "visible" })
      .populate("postedBy")
      .populate("comments.postedBy")
      .exec(function (err, photos) {
        if (err) {
          return res.status(500).json({
            message: "Error when getting hot photos.",
            error: err,
          });
        }

        photos.sort(function (a, b) {
          var aVotes = a.likes ? a.likes.length : 0;
          var bVotes = b.likes ? b.likes.length : 0;

          var aScore = hotScore(aVotes, 0, a.createdAt);
          var bScore = hotScore(bVotes, 0, b.createdAt);

          return bScore - aScore;
        });

        return res.json(photos);
      });
  },
};
