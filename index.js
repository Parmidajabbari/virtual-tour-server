const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const id = req.tourId || uuidv4();
    const dir = `uploads/${id}`;
    fs.ensureDirSync(dir);
    req.tourId = id;
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

app.post("/api/upload", upload.array("images", 20), (req, res) => {
  const tourId = req.tourId;
  const imageFiles = req.files.map((f) => `/uploads/${tourId}/${f.filename}`);

  const nodes = imageFiles.map((url, i) => {
    const node = {
      id: `${i + 1}`,
      panorama: url,
      name: `Scene ${i + 1}`,
      links: []
    };
    if (i > 0) {
      node.links.push({
        nodeId: `${i}`,
        position: { textureX: 1200, textureY: 1800 }
      });
    }
    if (i < imageFiles.length - 1) {
      node.links.push({
        nodeId: `${i + 2}`,
        position: { textureX: 300, textureY: 1800 }
      });
    }
    return node;
  });

  fs.writeJSONSync(`uploads/${tourId}/nodes.json`, nodes);
  res.json({ tourId });
});

app.get("/api/tour/:id", (req, res) => {
  const nodesPath = `uploads/${req.params.id}/nodes.json`;
  if (!fs.existsSync(nodesPath)) {
    return res.status(404).json({ error: "Tour not found" });
  }
  const nodes = fs.readJSONSync(nodesPath);
  res.json(nodes);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
