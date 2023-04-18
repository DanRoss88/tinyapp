const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

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
}
// to read encoded url
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.listen(PORT, () => {
  console.log(`tinyapp listening on port ${PORT}!`);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// index page
app.get('/', (req, res) => {
  res.render('pages/index');
});

// route for urls
app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

// third route for url/new - routes to be ordered from most specific to least
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


// second route for url/id
app.get('/urls/:id', (req, res) => {
  const templateVars = {id: req.params.id, longURL : urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
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

app.post('/urls/:id/delete',(req, res) => {
  delete urlDatabase[req.params.id];

  res.redirect('/urls');
})







