
// ******** Server Config ******** //

const cookieSession = require('cookie-session');
const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const app = express();
const salt = bcrypt.genSaltSync(10);


const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');

const { urlsForUser, getUserByEmail, generateRandomString } = require('./helpers');

// ******* Middleware ******** //

app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

}));


//// database //
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "b2xVn2"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "9sm5xK"
  }
};

const users = {
  'jif87e': {
    id: "jif87e",
    email: "a@123.com",
    password: "a123",
  },
  '9huijk': {
    id: "9huijk",
    email: "b@111.com",
    password: "b111",
  },
};

// ************** Home ********************* //
app.get('/', (req, res) => {

  if (req.session['user_id']) {
    return res.redirect('/urls');
  }

  res.redirect('/login');
});

//app.get("/urls.json", (req, res) => {
//res.json(urlDatabase);
//});

//////// ************************* LOGIN ******************** //////////////

app.get('/login', (req, res) => {

  if (req.session['user_id']) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: req.session['user_id']
  };

  res.render('login', templateVars);
});


app.post('/login', (req, res) => {

  const findUser = getUserByEmail(users, req.body.email);

  if (!findUser) {
    return res.status().send(`Status Code: ${res.statusCode}. User with this email cannot be found.`);
  }
  else if (!bcrypt.compareSync(req.body.password, users[findUser].password)) {
    return res.status().send(`Status Code: ${res.statusCode}. Password incorrect`);
  }

  req.session['user_id'] = users[findUser];
  res.redirect('/urls');
});

//// ***** Logout ****** /////

app.post('/logout', (req, res) => {

  req.session = null;
  res.redirect('/urls');
});

////////////////////// ************ Registration ************ //////////////////////

app.get('/register', (req, res) => {

  if (req.session['user_id']) {
    return res.redirect('/urls');
  };

  const templateVars = {
    user: req.session['user_id'],

  };

  res.render("register", templateVars);
});

// *********** Registration Form POST ********* //

app.post('/register', (req, res) => {

  if (!req.body.email || !req.body.password) {
    return res.status().send(`Status Code:${res.statusCode}. Email or Password is empty.`);
  };
  if (getUserByEmail(users, req.body.email)) {
    return res.status().send(`Status Code:${res.statusCode}.${req.body.email} has already been registered.`);
  }
  
  const id = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, salt);
   
  users[id] = {
    id,
    email,
    password
  };

  req.session['user_id'] = users[id];
  res.redirect('/urls');
});


///// ********** Main ************///////

// route for urls
app.get('/urls', (req, res) => {
 
let urlOb = {}
  if (req.session['user_id']){
urlOb = urlsForUser(urlDatabase, req.session['user_id'].id );
  }

const templateVars = {
  user: req.session['user_id'],
  urls: urlOb
  };

  

  res.render("urls_index", templateVars);
});


///////////////////// ******************* URLs *****************///////////////////////////

// create new small url ///
app.post("/urls", (req, res) => {

  if (!req.session['user_id']) {
    return res.status().send(`Status Code:${res.statusCode}. Please login or Register`);
  }

  const longID = req.body.longURL;
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = { 
    longURL: longID,
     userID: req.session['user_id'].id
    };

  res.redirect(`/urls/${shortURL}`);
});

////////*********  Create New URLs ****************///
app.get("/urls/new", (req, res) => {

 if (!req.session['user_id']) {
  return res.redirect('/login');
 }

  const templateVars = {
    user: req.session['user_id']
  };


  return res.render("urls_new", templateVars);
});

//*****delete URLs**********//
app.post('/urls/:shortURL/delete', (req, res) => {

  const shortID = req.params.shortURL;


  if (!req.session['user_id'] || req.session['user_id'].id !== urlDatabase[shortID].userID) {
    return res.status().send(`Status Code: ${res.statusCode}. Not Authorized`);
  }

  delete urlDatabase[shortID];
   res.redirect('/urls');
});

/////******* short url  ********///////
app.get('/urls/:shortURL', (req, res) => {

  ;
  const shortID = req.params.shortURL;

  if (!req.session['user_id'] || req.session['user_id'].id !== urlDatabase[shortID].userID) {
    return res.status().send(`Status Code: ${res.statusCode}. Please sign in to continue`);
  }

  if (!urlDatabase[shortID]) {
    return res.status().send(`Status Code: ${res.statusCode}. URL not found`);
  }

  

  const templateVars = {
    user: req.session['user_id'],
    shortURL: shortID,
    longURL: urlDatabase[shortID].longURL
  };

  return res.render("urls_show", templateVars);
});

// Edit form //
app.post('/urls/:shortURL', (req, res) => {

  const shortID = req.params.shortURL;
 
  if (!req.session['user_id'] || req.session['user_id'].id !== urlDatabase[shortID].userID) {
    return res.status().send(`Status Code: ${res.statusCode}. Not Authorized`);
  }
  
  const longID = req.body.longURL
  urlDatabase[shortID].longURL = longID;
  res.redirect('/urls');
});

 //*** redirect location of short url submission
app.get('/u/:shortURL', (req, res) => {

  const shortID = req.params.shortURL;

  if (!urlDatabase[shortID]) {
    return res.status().send(`Status Code:${res.statusCode}. URL not found`);
  }

  const longURL = urlDatabase[shortID].longURL;
   res.redirect(longURL);
});



// ********** Server Listen ***** //

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});