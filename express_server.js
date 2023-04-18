
// ******** Server Config ******** //


const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080
app.set('view engine', 'ejs');


// ******* Middleware ******** //

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

///// ************* FUNC Storage ******** //////////

const urlsForUser = function(urlDB, userID) {
  let userURLs = {};
  for (const url in urlDB) {
    if (urlDB[url].userID === userID) {
      userURLs[url] = {
        longURL: urlDB[url].longURL
      };
    }
  }
  return userURLs;
};

const getUserByEmail = function(userDB, email) {
  for (const user in userDB) {
    if (user[email] !== email) {
      return null;
    }
    return user[email];
  }
};


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
  user: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// ************** Home Page ********************* //


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


////////////////////// ************ Registration ************ //////////////////////
app.get('/register', (req, res) => {

  const userID = req.cookies.user_id;

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
    password: newUserPassword
  };

  req.cookies.user_id = newUserID;
  return res.redirect('/urls');
});

//////// ************************* LOGIN ******************** //////////////

app.get('/login', (req, res) => {

  const userID = req.cookies.user_id;


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
  if (loginPassword !== findUser.password) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Password incorrect`);
  }


  req.cookies.user_id = findUser.id;
  return res.redirect('/urls');
});

//// ***** Logout ****** /////

app.post('/logout', (req, res) => {
  

  res.clearCookie("user_id");
  return res.redirect('/login');
});


///////////////////// ******************* URLs *****************///////////////////////////

// route for urls
app.get('/urls', (req, res) => {
  const userID = req.cookies.user_id;
  const urls = urlsForUser(urlDatabase, userID);

  const templateVars = {
    user: users[userID],
    urls

  };

  if (!userID) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Please login to continue`);
  }

  res.render("urls_index", templateVars);
});


////////*********  Create New URLs ****************///
app.get("/urls/new", (req, res) => {
  const userID = req.cookies.user_id;

  const templateVars = {
    user: users[userID],
  };

  if (!userID) {
    return res.redirect('/login');
  }

  return res.render("urls_new", templateVars);
});

/////******* short url  ********///////
app.get('/urls/:id', (req, res) => {

  const userID = req.cookie.user_id;
  const urlID = req.params.id;

  if (!userID) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Please sign in to continue`);
  }

  if (!urlDatabase[urlID]) {
    return res.status(404).send(`Status Code: ${res.statusCode}. URL not found`);
  }

  if(userID !== urlDatabase[urlID].userID) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Wrong URL's`)
  }

  const templateVars = {
    user: users[userID],
    id: urlID,
    longURL: urlDatabase[urlID].longURL
  };

  return res.render("urls_show", templateVars);
});

// *** redirect location of short url submission
app.get('/u/:id', (req, res) => {

  const urlID = req.params.id;

if(!urlDatabase[urlID]){
  return res.status(404).send(`Status Code:${res.statusCode}. URL does not exist`)
}
const longURL = urlDatabase[urlID].longURL;
  return res.redirect(longURL);
});

// create new small url ///
app.post("/urls", (req, res) => {

  const userID = req.cookies.user_id;
  const longURL = req.body.longURL;
  if (!userID) {
    return res.send("Please login to create short URL's");
  }


  const uniqueID = generateRandomString();
  urlDatabase[uniqueID] = { longURL, userID };

 return res.redirect(`/urls/${uniqueID}`);
});

// Edit form //
app.post('/urls/:id', (req, res) => {
  
  const newURL = req.body.updatedURL;
  const userID = req.cookies.user_id;
  const urlID = req.params.id;

  if(!urlDatabase[urlID]) {
    return res.status(404).send(`Status Code: ${res.statusCode}. URL doesnt exist`)
  }

  if(!userID || userID !== urlDatabase[urlID].userID) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Not Authorized`)
  }

  
  urlDatabase[urlID].longURL = newURL;
  return res.redirect('/urls');
});

//delete button//
app.post('/urls/:id/delete', (req, res) => {
 
 
  const userID = req.cookies.user_id;
  const urlID = req.params.id;

  if(!urlDatabase[urlID]) {
    return res.status(404).send(`Status Code: ${res.statusCode}. URL doesnt exist`)
  }

  if(!userID || userID !== urlDatabase[urlID].userID) {
    return res.status(403).send(`Status Code: ${res.statusCode}. Not Authorized`)
  }

  delete urlDatabase[urlID];
  return res.redirect('/urls');
});



// ********** Server Listen ***** //

app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});