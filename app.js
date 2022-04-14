// Use bcrypt to encrypt database entries

// Logout user when they move from passwords route

// Set up constants
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const sessions = require("express-session");
const encrypt = require("mongoose-encryption");

const saltRounds = 10;
const port = 3000;

// Set up app
const app = express();

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

// Set up sessions
app.use(sessions({
  secret: "secret string",
  resave: false,
  saveUninitialized: true
}));


// Connect to mongoose and create user model
mongoose.connect("mongodb://localhost:27017/passwordsDB");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  accounts: [{
    website: {type: String},
    password: {type: String}
  }]
});

const encKey = "IVvlQGEVNNQCZyzn4uHWefhlpPhR4BMkiMzLth/vY+c=";
const sigKey = "hLEXg3EoG/wGZRbb4e+t8iisbNXDRxhbwG//dJKjCCZo1wBf28ukmAeTHz/ZELejbZpLUHrsGCROoLfqrHqBXg==";

// userSchema.plugin(encrypt, {encryptionKey: encKey, signingKey: sigKey, encryptedFields: ["accounts"]});


const User = mongoose.model("User", userSchema);


// Keep track of logged in user
var session;


// get requests
// get root/home route if user not logged in, otherwise get dashboard
app.get("/", function(req, res) {
  session = req.session;
  if (session.userid) {
    res.redirect("/dashboard");
  } else {
    res.render("home");
  }
});

// get page for user to register an account
app.get("/register", function(req, res) {
  res.render("register", {feedback: ""});
});

// get page for user to login if they already have an account
app.get("/login", function(req, res) {
  res.render("login", {feedback: ""});
});

// get dashboard if user is signed in, otherwise redirect to home route
app.get("/dashboard", function(req, res) {
  session = req.session;
  if (session.userid) {
    res.render("dashboard", {username: session.userid});
  } else {
    res.redirect("/");
  }
});

// get page for user to save credentials to their account for different websites
app.get("/password-add", function(req, res) {
  session = req.session;
  res.render("add", {username: session.userid, feedback: ""});
});

// get page for user to search their account for saved credentials
app.get("/password-search", function(req, res) {
  session = req.session;
  res.render("search", {username: session.userid, website: "", password: "", feedback: ""});
});

// get home route when user logs out and destroy their session
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
// post user account details to register an account
app.post("/register", function(req, res) {

  const enteredUsername = req.body.username;
  const enteredPassword = req.body.password;
  const retypedPassword = req.body.retypedPassword;

  // checked two entered passwords match
  if (enteredPassword != retypedPassword) {
    res.render("register", {feedback: "Failure"});
  } else {
    // check if there is already an account with entered username
    User.findOne({username: enteredUsername}, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          // if account exists already, show alert on register page
          res.render("register", {feedback: "User exists"});
        } else {
          // if account does not exist, create new user for DB
          // encrypt password with bcrypt
          bcrypt.hash(enteredPassword, saltRounds, function(err, hash) {
            if (err) {
              console.log(err);
            } else {
              // create and save user with encrypted password
              const newUser = new User({
                username: enteredUsername,
                password: hash
              });
              newUser.save(function(err) {
                if (err) {
                  console.log(err);
                } else {
                  // create session for user
                  session = req.session;
                  session.userid = enteredUsername;
                  res.redirect("/dashboard");
                }
              });
            }
          });
        }
      }
    });
  }
});


// post user login details to be verified and to log user in
app.post("/login", function(req, res) {

  const enteredUsername = req.body.username;
  const enteredPassword = req.body.password;

  // check username exists in DB
  User.findOne({username: enteredUsername}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      // if user exists, check password is correct and start session if it is
      if (foundUser) {
        bcrypt.compare(enteredPassword, foundUser.password, function(err, result) {
          if (err) {
            console.log(err);
          } else {
            if (result === true) {
              session = req.session;
              session.userid = enteredUsername;
              res.redirect("/dashboard");
            } else {
              // show error if password is incorrect
              res.render("login", {feedback: "Failure"});
            }
          }
        });
      } else {
        // show error if account does not exist
        res.render("login", {feedback: "Failure"});
      }
    }
  });

});


// post website credentials added to DB by user
app.post("/password-add", function(req, res) {

  const username = session.userid;
  const enteredWebsite = req.body.website;
  const enteredPassword = req.body.password;

  var userExists = false;

  // Find logged in user
  User.findOne({username: username}, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      const userAccounts = foundUser.accounts;
      // Check to see if user has details saved for this website already
      userAccounts.forEach(function(account) {
        if (account.website === enteredWebsite) {
          userExists = true;
        }
      });
      if (userExists) {
        res.render("add", {username: username, feedback: "Failure"});
      } else {
        // Save these credentials if details do not exist for this website
        userAccounts.push({
          website: enteredWebsite,
          password: enteredPassword
        });
        foundUser.save(function(err) {
          if (err) {
            console.log(err);
          } else {
            // show user that details were saved successfully
            res.render("add", {username: username, feedback: "Success"});
          }
        });
      }
    }
  });
});


// post user's website credentials search
app.post("/password-search", function(req, res) {

  const username = session.userid;
  const enteredWebsite = req.body.website;
  const updatedPassword = req.body.password;
  const buttonClicked = req.body.button;
  var accountIndex = "";

  var accountExists = false;
  var accountPassword = "";

  if (buttonClicked === "search") {
    // find user details in DB
    User.findOne({username: username}, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        const userAccounts = foundUser.accounts;
        // check searched website exists
        userAccounts.forEach(function(account) {
          if (account.website === enteredWebsite) {
            accountExists = true;
            accountPassword = account.password;
          }
        });
        if (accountExists) {
          // show details for found website
          res.render("search", {username: username, website: enteredWebsite, password: accountPassword, feedback: ""});
        } else {
          // show user credentials were not found for this website
          res.render("search", {username: username, website: enteredWebsite, password: "", feedback: "Failure"});
        }
      }
    });

  } else if (buttonClicked === "save") {
    // find user details in DB
    User.findOne({username: username}, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          console.log(foundUser);
          const userAccounts = foundUser.accounts;
          userAccounts.forEach(function(account, i) {
            if (account.website === enteredWebsite) {
              accountIndex = i;
              accountExists = true;
            }
          });
          if (accountExists) {
            foundUser.accounts[accountIndex].password = updatedPassword;
            foundUser.save(function(err) {
              if (err) {
                console.log(err);
              } else {
                res.render("search", {username: username, website: "", password: "", feedback: "Success"});
              }
            });
          } else {
            res.render("search", {username: username, website: enteredWebsite, password: "", feedback: "Failure"});
          }
        }
      }
    });

  } 



});



app.listen(port, function() {
  console.log("Server started on port " + port);
});
