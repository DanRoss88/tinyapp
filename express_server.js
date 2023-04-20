
/////////// ******** Server Config ******** ////////////

const cookieSession = require('cookie-session');
const express = require("express");
const methodOverride = require('method-override');
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');

const { urlsForUser, getUserByEmail, generateRandomString, urlPrefix } = require('./helpers');

///////// *******/ MIDDLEWARE /******** ///////////

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

}));


////////////****************/ DATABASE /********************///////////
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userID1"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userID2"
  }
};

const users = {
  'user1': {
    id: "user1",
    email: "a@123.com",
    password: "$2a$10$C2mEXCIkm0yIgjiwFAq4iuGPn3N10TetpcMnkQaHplbzLVXubmCWa'"
  },
  'user2': {
    id: "user2",
    email: "b@111.com",
    password: "$2a$10$Y1KjOyNC65By.1DTp.p1kubJxzrFUFxlhPPoZadq3kxVH1ADKYBA2"
  },
};

//////////////// ************** LANDING ********************* //////////////////
//////READ
app.get('/', (req, res) => {

  if (req.session['user_id']) {
    return res.redirect('/urls');
  }

  res.redirect('/login');
});


/////////////// ************************* LOGIN ******************** ////////////////////
/////////READ
app.get('/login', (req, res) => {

  if (req.session['user_id']) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: req.session['user_id']
  };

  res.render('login', templateVars);
});

///////////***********LOGIN ATTEMPT *************///////////
////////EDIT
app.post('/login', (req, res) => {

  const findUser = getUserByEmail(users, req.body.email);

  if (!findUser) {
    return res.status(403).send("User with this email cannot be found");
  }
  else if (!bcrypt.compareSync(req.body.password, users[findUser].password)) {
    return res.status(403).send("Password incorrect");
  }

  req.session['user_id'] = users[findUser];
  res.redirect('/urls');
});

////////////// ********** LOGOUT ********* /////////////////
/////EDIT
app.post('/logout', (req, res) => {

  req.session = null;
  res.redirect('/urls');
});

////////////////////// ************ REGISTRATION ************ //////////////////////
//////READ/////
app.get('/register', (req, res) => {

  if (req.session['user_id']) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: req.session['user_id'],

  };

  res.render("register", templateVars);
});

///////// *********** REGISTRATION POST ********* ///////////
//////ADD/////////
app.post('/register', (req, res) => {

  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Email or Password is invalid");
  }
  if (getUserByEmail(users, req.body.email)) {
    return res.status(400).send("Email is already registered");
  }

  const id = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);

  users[id] = {
    id,
    email,
    password
  };

  req.session['user_id'] = users[id];
  res.redirect('/urls');
});


//////////////////********** MAIN ************///////////////////
////// ROUTE FOR MAIN /////
//////BROWSE
app.get('/urls', (req, res) => {

  let urlOb = {};
  if (req.session['user_id']) {
    urlOb = urlsForUser(urlDatabase, req.session['user_id'].id);
  }

  const templateVars = {
    user: req.session['user_id'],
    urls: urlOb
  };


  res.render("urls_index", templateVars);
});


////////////////// *********** URLs *************//////////////////
/////////ADD
app.post("/urls", (req, res) => {

  if (!req.session['user_id']) {
    return res.status(403).send("Please login or Register");
  }

  const longID = urlPrefix(req.body.longURL);
  const shortUID = generateRandomString();

  urlDatabase[shortUID] = {
    longURL: longID,
    userID: req.session['user_id'].id
  };

  res.redirect(`/urls/${shortUID}`);
});

////////********* SETUP NEW URL ***********////////
////////READ
app.get("/urls/new", (req, res) => {

  if (!req.session['user_id']) {
    return res.redirect('/login');
  }

  const templateVars = {
    user: req.session['user_id']
  };


  return res.render("urls_new", templateVars);
});


////***** DELETE URLs ******////
///DELETE
app.delete('/urls/:shortURL', (req, res) => {

  const shortID = req.params.shortURL;


  if (!req.session['user_id'] || req.session['user_id'].id !== urlDatabase[shortID].userID) {
    return res.status(403).send("Not Authorized");
  }

  delete urlDatabase[shortID];
  res.redirect('/urls');
});

/////******* SHORT URL ********///////
///////READ
app.get('/urls/:shortURL', (req, res) => {

  
  const shortID = req.params.shortURL;

  if (!req.session['user_id'] || req.session['user_id'].id !== urlDatabase[shortID].userID) {
    return res.status(403).send("Not Authorized");
  }

  if (!urlDatabase[shortID]) {
    return res.status(404).send("URL not found");
  }


  const templateVars = {
    user: req.session['user_id'],
    shortURL: shortID,
    longURL: urlDatabase[shortID].longURL
  };

  return res.render("urls_show", templateVars);
});

/////////////////// EDIT FORM //////////////////////
////////EDIT
app.put('/urls/:shortURL', (req, res) => {

  const shortID = req.params.shortURL;

  if (!req.session['user_id'] || req.session['user_id'].id !== urlDatabase[shortID].userID) {
    return res.status(403).send("Not Authorized");
  }

  const longID = urlPrefix(req.body.longURL);
  urlDatabase[shortID].longURL = longID;
  res.redirect('/urls');
});

/////////**** REDIRECT SHORT URL ****/////////
//////READ
app.get('/u/:shortURL', (req, res) => {

  const shortID = req.params.shortURL;

  if (!urlDatabase[shortID]) {
    return res.status(404).send("URL not found");
  }

  const longURL = urlDatabase[shortID].longURL;
  res.redirect(longURL);
});


///////// ********** SERVER LISTEN ********** /////////

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});