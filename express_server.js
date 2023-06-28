const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.set('view engine', 'ejs')

function generateRandomString() {
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumericChars.length);
    randomString += alphanumericChars.charAt(randomIndex);
  }

  return randomString;
}
function getUserByEmail(email) {
  for (const userKey in users) {
    const user = users[userKey];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}




const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  
};

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.userId;
  const templateVars = { currentUser: users[userId] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.userId;
  const templateVars = { 
    currentUser: users[userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.userId;
  const templateVars = { 
    currentUser: users[userId],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
app.post("/urls", (req, res) => {
  const newKey = generateRandomString()
  urlDatabase[newKey] = req.body.longURL
  res.redirect(`/urls/${newKey}`)
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls/');
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.longURL;
  urlDatabase[id] = newURL;
  res.redirect('/urls/');
});

app.post("/login", (req, res) => {
 const input = req.body.login
  res.cookie('username',input)
  res.redirect('/urls')
});

app.post("/logout", (req, res) => {
  const input = req.body.login
   res.clearCookie('username',input)
   res.redirect('/urls')
 });

 app.get("/register", (req, res) => {
  const userId = req.cookies.userId;
  const templateVars = {
    currentUser: users[userId],
    urls: urlDatabase
  };
  res.render("register.ejs", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  if (email.length === 0 || password.length === 0) {
    res.status(400).send("Empty Username or Password");
    return;
  }

  if (getUserByEmail(email) === null) {
    const newUser = {
      id,
      email,
      password,
    };

    users[id] = newUser;
    res.cookie("userId", id);
    console.log(users);
    res.redirect('/urls');
  } else {
    res.status(400).send("User with the same email already exists");
  }
});

app.get("/login", (req, res) => {
  const userId = req.cookies.userId;
  const templateVars = {
    currentUser: users[userId],
    urls: urlDatabase
  };
  res.render("login.ejs", templateVars);
});