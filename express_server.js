


// ******** Server Config ******** //


const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');





// ******* Middleware ******** //

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

///// ************* Storage ******** //////////
const users = {
  userID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  userID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};


// for generating random string of characters for short url 
const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let counter = 0;
  while (counter < 6) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
    counter += 1;
  }
  return result;
};


//// base //
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
// ************** Home Page ********************* //


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// route for urls
app.get('/urls', (req, res) => {
  const templateVars = {
    user: users[userID],
    urls: urlDatabase

  };
  res.render("urls_index", templateVars);
});


// New URL


// third route for url/new - routes to be ordered from most specific to least
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("urls_new", templateVars);
});


// second route for url/id
app.get('/urls/:id', (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});


app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.url;

  res.redirect('/urls');
});

// post for URL submission
app.post("/urls", (req, res) => {
  const uniqueID = generateRandomString();
  urlDatabase[uniqueID] = req.body.longURL;

  res.redirect(`/urls/${uniqueID}`);
});

// redirect location of short url submission
app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];

  res.redirect(longURL);
});
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];

  res.redirect('/urls');
});
// ******* LOGIN *********** //
app.post('/login', (req, res) => {
  const userID = req.cookies["user_id"];

  res.cookie("user_id", userID);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');

});
/*
If the e-mail or password are empty strings, send back a response with the 400 status code.
If someone tries to register with an email that is already in the users object, send back a response with the 400 status code.
*/
// ************ Registration ************ //
app.post('/register', (req, res) => {

  const newUserID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;

users[newUserID] = {
id: newUserID,
email: newUserEmail,
password: newUserPassword
}

res.cookie("user_id", newUserID);
res.redirect('/urls');
});



app.get('/register', (req, res) => {
  const templateVars = {
    username: req.cookies["user_id"],
    email: req.body.email,
    password: req.body.password
  };

  res.render("register", templateVars);
});


// passwords check validity
/* if (password === req.body.password){
   res.cookie('username', username); // storing username after passwords validity
   res.send('Nice! You are successfully logged in.'); // response after
 }
 else{
   res.send('Failed to log in!');  // if password checks fail
 }

*/


// ********** Server Listen ***** //

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});