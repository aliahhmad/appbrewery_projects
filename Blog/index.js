import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const port = 3000;
const filePath = "./data/posts.json";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function readData() {
  const rawData = fs.readFileSync(filePath, "utf8");

  return JSON.parse(rawData);
}

app.get("/", (req, res) => {
  const data = readData();
  res.render("index.ejs", {title: "Posts", posts: data.posts});
});

app.get("/about", (req, res) => {
  res.render("about.ejs", {title: "About"});
});

app.get("/create", (req, res) => {
  res.render("create.ejs", {title: "Create Post"});
});

app.post("/createPost", (req, res) => {
  const data = readData();
  const today = new Date().toISOString().split("T")[0];

  const newPost = {
    id: data.id + 1,
    title: req.body["postTitle"],
    author: req.body["postAuthor"],
    text: req.body["postText"],
    date: today
  }

  data.id = data.id + 1;
  data.posts.push(newPost);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.redirect("/");
});

app.post("/edit", (req, res) => {
  const data = readData();
  const postId = Number(req.body.postId);

  if (isNaN(postId)) {
    return res.status(400).send("Invalid post ID");
  }

  const post = data.posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).send("Post not found");
  }

  res.render("edit.ejs", { title: "Edit Post", post });
});

app.post("/editPost", (req, res) => {
  const data = readData();
  const postId = Number(req.body.postId);
  const today = new Date().toISOString().split("T")[0];

  for (let i = 0; i < data.posts.length; i++) {
    if (data.posts[i].id === postId) {
      data.posts.splice(i,1);
    }
  }

  const newPost = {
    id: postId,
    title: req.body["postTitle"],
    author: req.body["postAuthor"],
    text: req.body["postText"],
    date: today
  }

  data.posts.push(newPost);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.redirect("/");
});

app.post("/deletePost", (req, res) => {
  const data = readData();
  const postId = Number(req.body.postId);

  if (isNaN(postId)) {
    return res.status(400).send("Invalid post ID");
  }

  const post = data.posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).send("Post not found");
  }

  for (let i = 0; i < data.posts.length; i++) {
    if (data.posts[i].id === postId) {
      data.posts.splice(i,1);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
