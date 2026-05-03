var express = require("express");
// Vključimo multer za file upload
var multer = require("multer");
var upload = multer({ dest: "public/images/" });

var router = express.Router();
var photoController = require("../controllers/photoController.js");

function requiresLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    var err = new Error("You must be logged in to view this page");
    err.status = 401;
    return next(err);
  }
}

router.get("/", photoController.list);
router.post("/", requiresLogin, upload.single("image"), photoController.create);
router.get("/hot", photoController.hot);

router.post("/:id/comments", requiresLogin, photoController.addComment);
router.post("/:id/like", requiresLogin, photoController.like);
router.post("/:id/unlike", requiresLogin, photoController.unlike);
router.post("/:id/report", requiresLogin, photoController.report);

router.get("/:id", photoController.show);
router.put("/:id", photoController.update);
router.delete("/:id", photoController.remove);

module.exports = router;
