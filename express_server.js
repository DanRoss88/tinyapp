
// ******** Server Config ******** //

const cookieSession = require('cookie-session');
const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const app = express();
const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');

const { urlsForUser, getUserByEmail, generateRandomString } = require('./helpers');

// ******* Middleware ******** //

app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

}));


//// database //
const urlDatabase = {
  "": {
    longURL: "http://www.lighthouselabs.ca",
    userID: ""
  },
  "": {
    longURL: "http://www.google.com",
    userID: "K"
  }
};

const users = {
  'jif87e': {
    id: "jif87e",
    email: "a@123.com",
    password: "purple-dinosaur",
  },
  '9huijk': {
    id: "9huijk",
    email: "b@111.com",
    password: "dishwasher-funk",
  },
};

// ************** Home Page ********************* //
app.get('/', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    return res.redirect('/login');
  }

  return res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


////////////////////// ************ Registration ************ //////////////////////
app.get('/register', (req, res) => {

  const userID = req.session.user_id;

  const templateVars = {
    user: users[userID],

  };

  if (userID) {
    return res.redirect('/urls');
  }

  return res.render("register", templateVars);
});

// *********** Registration Form POST ********* //
app.post('/register', (req, res) => {

  const newUserID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newUserPassword, salt);
  const duplicateEmail = getUserByEmail(users, newUserEmail);


  if (newUserEmail === '' || newUserPassword === '') {
    return res.status(400).send(`Status Code:${res.statusCode}. Email or Password is empty.`);
  };

  if (duplicateEmail) {
    return res.status(400).send(`Status Code:${res.statusCode}.${newUserEmail} has already been registered.`);
  }


  users[newUserID] = {
    id: newUserID,
    email: newUserEmail,
    password: hashedPassword
  };

  req.session.user_id = newUserID;
  return res.redirect('/urls');
});

//////// ************************* LOGIN ******************** //////////////

app.get('/login', (req, res) => {

  const userID = req.session.user_id;


  const templateVars = {
    user: users[userID]
  };

  if (userID) {
    return res.redirect('/urls');
  }

  return res.render('login', templateVars);

});


app.post('/login', (req, res) => {

  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  const findUser = getUserByEmail(users, loginEmail);

  if (!findUser) {
    return res.status(403).send(`Status Code: ${res.statusCode}. User with this email cannot be found.`);
  }
  if (!bcrypt.compareSync(loginPassword, findUser.password)) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Password incorrect`);
  }


  req.session.user_id = findUser.id;
  return res.redirect('/urls');
});

//// ***** Logout ****** /////

app.post('/logout', (req, res) => {


  res.clearCookie('session');
  return res.redirect('/login');
});


///////////////////// ******************* URLs *****************///////////////////////////

// route for urls
app.get('/urls', (req, res) => {

  const userID = req.session.user_id;
  const urls = urlsForUser(urlDatabase, userID);

  const templateVars = {

    urls,
    user: users[userID]
  };

  if (!userID) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Please login to continue`);
  }

  res.render("urls_index", templateVars);
});


////////*********  Create New URLs ****************///
app.get("/urls/new", (req, res) => {

  const userID = req.session.user_id;

  const templateVars = {
    user: users[userID]
  };

  if (!userID) {
    return res.redirect('/login');
  }

  return res.render("urls_new", templateVars);
});

/////******* short url  ********///////
app.get('/urls/:id', (req, res) => {

  const userID = req.session.user_id;
  const urlID = req.params.id;

  if (!userID) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Please sign in to continue`);
  }

  if (!urlDatabase[urlID]) {
    return res.status(404).send(`Status Code: ${res.statusCode}. URL not found`);
  }

  if (userID !== urlDatabase[urlID].userID) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Wrong URL's`);
  }

  const templateVars = {
    id: urlID,
    user: users[userID],
    longURL: urlDatabase[urlID].longURL
  };

  return res.render("urls_show", templateVars);
});

// *** redirect location of short url submission
app.get('/u/:id', (req, res) => {

  const urlID = req.params.id;

  if (!urlDatabase[urlID]) {
    return res.status(404).send(`Status Code:${res.statusCode}. URL does not exist`);
  }

  const longURL = urlDatabase[urlID].longURL;
  return res.redirect(longURL);
});

// create new small url ///
app.post("/urls", (req, res) => {

  const userID = req.session.user_id;
  const longURL = req.body.longURL;
  const uniqueID = generateRandomString();
  
  if (!userID) {
    return res.send("Please login to create short URL's");
  }

  
  urlDatabase[uniqueID] = { longURL, userID };

  return res.redirect(`/urls/${uniqueID}`);
});

// Edit form //
app.post('/urls/:id', (req, res) => {

  const newURL = req.body.updatedURL;
  const userID = req.session.user_id;
  const urlID = req.params.id;

  if (!urlDatabase[urlID]) {
    return res.status(404).send(`Status Code: ${res.statusCode}. URL doesnt exist`);
  }

  if (!userID || userID !== urlDatabase[urlID].userID) {
    return res.status(401).send(`Status Code: ${res.statusCode}. Not Authorized`);
  }


  urlDatabase[urlID].longURL = newURL;
  return res.redirect('/urls');
});

//delete button//
app.post('/urls/:id/delete', (req, res) => {


  const userID = req.session.user_id;
  const urlID = req.params.id;

  if (!urlDatabase[urlID]) {
    return res.status(404).send(`Status Code: ${res.statusCode}. URL doesnt exist`);
  }

  if (!userID || userID !== urlDatabase[urlID].userID) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Not Authorized`);
  }

  delete urlDatabase[urlID];
  return res.redirect('/urls');
});



// ********** Server Listen ***** //

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});