const express = require("express");
const session = require("express-session");
const path = require("path");
const env = require("dotenv");

env.config();
const app = express();

if (!process.env.EMAIL ||!process.env.PASSWORD ||!process.env.SESSION_SECRET) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

app.use(express.static(path.join(__dirname, "/public")));
app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Cache control
app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// Routes
app.get("/", (req, res) => {
  if (req.session.loginState) {
    res.redirect("/homePage");
  } else {
    const error = req.session.error;
    req.session.error = null;
    res.render("login", { error });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.EMAIL && password === process.env.PASSWORD) {
    req.session.loginState = true;
    res.redirect("/homePage");
  } else {
    req.session.error = "!!! Invalid !!!";
    res.redirect("/");
  }
});

app.post("/logOut", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Failed to log out.");
    }
    res.redirect("/");
  });
});

app.get("/homePage", (req, res) => {
  if (req.session.loginState) {
    res.render("homePage");
  } else {
    res.redirect("/");
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start server
app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
