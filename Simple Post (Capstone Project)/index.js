import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const port = 3000;
const filePath = "./data/posts.json";

// Parse form submissions.
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static assets like CSS and images.
app.use(express.static("public"));

// Load the saved posts data from the JSON file.
function readData() {
  const rawData = fs.readFileSync(filePath, "utf8");

  return JSON.parse(rawData);
}

// Show all blog posts on the home page.
app.get("/", (req, res) => {
  const data = readData();
  res.render("index.ejs", {title: "Posts", posts: data.posts});
});

// Render the about page.
app.get("/about", (req, res) => {
  res.render("about.ejs", {title: "About"});
});

// Render the form for creating a new post.
app.get("/create", (req, res) => {
  res.render("create.ejs", {title: "Create Post"});
});

// Save a newly created post.
app.post("/createPost", (req, res) => {
  const data = readData();
  const today = new Date().toISOString().split("T")[0];

  // Build the new post object from the submitted form data.
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

// Load the selected post into the edit form.
app.post("/edit", (req, res) => {
  const data = readData();
  const postId = Number(req.body.postId);

  // Stop the request if the submitted id is not a number.
  if (isNaN(postId)) {
    return res.status(400).send("Invalid post ID");
  }

  const post = data.posts.find(p => p.id === postId);

  // Return an error if the matching post does not exist.
  if (!post) {
    return res.status(404).send("Post not found");
  }

  res.render("edit.ejs", { title: "Edit Post", post });
});

// Replace the old post data with the edited version.
app.post("/editPost", (req, res) => {
  const data = readData();
  const postId = Number(req.body.postId);
  const today = new Date().toISOString().split("T")[0];

  // Remove the original version of the post before saving the update.
  for (let i = 0; i < data.posts.length; i++) {
    if (data.posts[i].id === postId) {
      data.posts.splice(i,1);
    }
  }

  // Rebuild the post using the updated form values.
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

// Delete a post by its submitted id.
app.post("/deletePost", (req, res) => {
  const data = readData();
  const postId = Number(req.body.postId);

  // Stop the request if the submitted id is not a number.
  if (isNaN(postId)) {
    return res.status(400).send("Invalid post ID");
  }

  const post = data.posts.find(p => p.id === postId);

  // Return an error if the matching post does not exist.
  if (!post) {
    return res.status(404).send("Post not found");
  }

  // Remove the post from the saved posts array.
  for (let i = 0; i < data.posts.length; i++) {
    if (data.posts[i].id === postId) {
      data.posts.splice(i,1);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.redirect("/");
});

// Start the server.
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
