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

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

// Connect to mongoose
mongoose.connect("mongodb://localhost:27017/passwordsDB");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  accounts: [{
    website: {type: String},
    password: {type: String}
  }]
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
  res.render("passwords", {username: user, feedback: "Add new passwords or search for saved data"});
});

app.get("/password-add", function(req, res) {
  res.render("add", {feedback: ""});
});

app.get("/password-search", function(req, res) {
  res.render("search", {website: "", password: ""});
});


// post requests
app.post("/register", function(req, res) {

  const enteredUsername = req.body.username;
  const enteredPassword = req.body.password;
  const retypedPassword = req.body.retypedPassword;

  if (enteredPassword != retypedPassword) {
    console.log("Passwords must match!");
    res.redirect("/register");
  } else {
    User.findOne({username: enteredUsername}, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          console.log("User already exists");
          res.redirect("/register");
        } else {
          const newUser = new User({
            username: enteredUsername,
            password: enteredPassword
          });
          newUser.save(function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully saved user to database");
              user = enteredUsername;
              res.redirect("/password-home");
            }
          });
        }
      }
    });
  }

});


app.post("/login", function(req, res) {

  const enteredUsername = req.body.username;
  const enteredPassword = req.body.password;

  User.findOne({username: enteredUsername}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser && foundUser.password === enteredPassword) {
        user = enteredUsername;
        res.redirect("/password-home");
      } else {
        console.log("Incorrect credentials");
        res.redirect("/login");
      }
    }
  });

});


app.post("/password-add", function(req, res) {

  const enteredWebsite = req.body.website;
  const enteredPassword = req.body.password;
  var accountExists = false;

  // Find logged in user
  User.findOne({username: user}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      const userAccounts = foundUser.accounts;
      // Check to see if user has details saved for this website already
      userAccounts.forEach(function(account) {
        if (account.website === enteredWebsite) {
          accountExists = true;
          res.render("add", {feedback: "Credentials already saved for this website"});
        }
      });
      // Save these credentials if details do not exist for this website
      if (!accountExists) {
        userAccounts.push({
          website: enteredWebsite,
          password: enteredPassword
        });
        foundUser.save(function(err) {
          if (err) {
            console.log(err);
          } else {
            res.render("passwords", {username: user, feedback: "Success"});
          }
        });
      }
    }
  });

});


app.post("/password-search", function(req, res) {

  const enteredWebsite = req.body.website;
  var accountExists = false;

  User.findOne({username: user}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      const userAccounts = foundUser.accounts;
      userAccounts.forEach(function(account) {
        if (account.website === enteredWebsite) {
          res.render("search", {website: enteredWebsite, password: account.password});
          accountExists = true;
        }
      });
      if (!accountExists) {
        res.render("search", {website: enteredWebsite, password: "Credentials not found"});
      }
    }
  });

});



app.listen(port, function() {
  console.log("Server started on port " + port);
});
