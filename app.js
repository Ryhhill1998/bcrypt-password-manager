// Use bcrypt to encrypt database entries

// Logout user when they move from passwords route

// Set up constants
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const sessions = require("express-session");

const saltRounds = 10;
const port = 3000;

// Set up app
const app = express();

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(sessions({
  secret: "secret string",
  resave: false,
  saveUninitialized: true
}));



// Connect to mongoose
mongoose.connect("mongodb://localhost:27017/passwordsDB");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  sessionId: String,
  accounts: [{
    website: {type: String},
    password: {type: String}
  }]
});

const User = mongoose.model("User", userSchema);

// Keep track of logged in user
var session;

// Keep track if user just saved account
var savedAccount = false;


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

app.get("/dashboard", function(req, res) {
  session = req.session;
  if (session.userid) {
    res.render("dashboard", {username: session.userid});
  } else {
    res.redirect("/");
  }
});

app.get("/password-add", function(req, res) {
  res.render("add", {feedback: ""});
});

app.get("/password-search", function(req, res) {
  res.render("search", {website: "", password: ""});
});

app.get("/logout", function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully destroyed session.");
    }
  });
  res.redirect("/");
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
              session = req.session;
              session.userid = enteredUsername;
              res.redirect("/dashboard");
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
        session = req.session;
        session.userid = enteredUsername;
        res.redirect("/dashboard");
      } else {
        console.log("Incorrect credentials");
        res.redirect("/login");
      }
    }
  });

});


app.post("/password-add", function(req, res) {

  const username = session.userid;
  const enteredWebsite = req.body.website;
  const enteredPassword = req.body.password;
  var accountExists = false;

  // Find logged in user
  User.findOne({username: username}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      const userAccounts = foundUser.accounts;
      // Check to see if user has details saved for this website already
      userAccounts.forEach(function(account) {
        if (account.website === enteredWebsite) {
          accountExists = true;
          res.render("add", {feedback: "Failure"});
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
            savedAccount = true;
            res.render("add", {feedback: "Success"});
          }
        });
      }
    }
  });

});


app.post("/password-search", function(req, res) {

  const username = session.userid;
  const enteredWebsite = req.body.website;
  var accountExists = false;

  User.findOne({username: username}, function(err, foundUser) {
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
