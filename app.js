// Use bcrypt to encrypt database entries

// Logout user when they move from passwords route

// Set up constants
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const port = 3000;

// Set up app
const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

// Connect to mongoose
mongoose.connect("mongodb://localhost:27017/passwordsDB");

const accountSchema = new mongoose.Schema({
  website: String,
  password: String
});

const Account = mongoose.model("Account", accountSchema);


const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  accounts: [accountSchema]
});

const User = mongoose.model("User", userSchema);


// Keep track of logged in user
var user = "";


// get requests
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/password-home", function(req, res) {
  res.render("passwords", {username: user});
});

app.get("/password-add", function(req, res) {
  res.render("add");
});

app.get("/password-search", function(req, res) {
  res.render("search");
});


// post requests
app.post("/register", function(req, res) {

  const enteredUsername = req.body.username;
  const enteredPassword = req.body.password;

  User.findOne({username: enteredUsername}, function(err, foundAccount) {
    if (err) {
      console.log(err);
    } else {
      if (foundAccount) {
        console.log("Account already exists");
        res.redirect("/register");
      } else {
        const newAccount = new User({
          username: enteredUsername,
          password: enteredPassword
        });
        newAccount.save(function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved account to database");
            user = enteredUsername;
            res.redirect("/password-home");
          }
        });
      }
    }
  });

});


app.post("/login", function(req, res) {

  const enteredUsername = req.body.username;
  const enteredPassword = req.body.password;

  User.findOne({username: enteredUsername}, function(err, foundAccount) {
    if (err) {
      console.log(err);
    } else {
      if (foundAccount && foundAccount.password === enteredPassword) {
        user = enteredUsername;
        res.redirect("/password-home");
      } else {
        console.log("Incorrect credentials");
      }
    }
  });

});


// app.post("/password-add", function(req, res) {
//
//
//
// })



app.listen(port, function() {
  console.log("Server started on port " + port);
});
