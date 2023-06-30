const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session')
const bcrypt = require("bcryptjs");

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const cookieSessionConfig = cookieSession({
  name: 'myCookieSession',
  keys: ['my-secret-word'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours,
});

app.use(cookieSessionConfig);

const generateRandomString = function() {
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumericChars.length);
    randomString += alphanumericChars.charAt(randomIndex);
  }

  return randomString;
};

const getUserByEmail = function(email) {
  for (const userKey in users) {
    const user = users[userKey];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const urlsForUser = function(id) {
  const userUrls = {};
  for (const urlKey in urlDatabase) {
    if (urlDatabase[urlKey].userID === id) {
      userUrls[urlKey] = urlDatabase[urlKey];
    }
  }
  return userUrls;
}

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  
};

app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.redirect('/login');
    return;
  } else {
  const templateVars = { currentUser: users[userId] };
  res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const urlId = req.params.id;

  if (!userId) {
    res.status(400).send('Please log in to view URLs<br><a href="/register">Register!!</a><br><a href="/login">Login!!</a>');
    return;
  }

  if (!urlDatabase[urlId] || urlDatabase[urlId].userID !== userId) {
    res.status(403).send('You do not have permission to access this URL');
    return;
  }

  const templateVars = {
    currentUser: users[userId],
    id: urlId,
    longURL: urlDatabase[req.params.id].longURL
  };

  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  if( !userId) {
    res.status(400).send('Please log in to view URLs<br><a href="/register">Register!!</a><br><a href="/login">Login!!</a>');
      return;
  }
  const userUrls = urlsForUser(userId)
  const templateVars = {
    currentUser: users[userId],
    urls: userUrls
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
  const userId = req.session.userId;
  if (!userId) {
    res.send('Please login to create new tinyUrl')
    return;
  } else {
  const newKey = generateRandomString();
  urlDatabase[newKey] = req.body;
  urlDatabase[newKey].userID = userId;
  res.redirect(`/urls/${newKey}`);
  }
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  const userId = req.session.userId;
  const urlId = req.params.id;

  if (!urlDatabase[urlId] || urlDatabase[urlId].userID !== userId) {
    res.status(403).send('You do not have permission to access this URL');
    return;
  }
  if (longURL === undefined) {
    res.status(400).send("No such Url exists");
    return;
  } else {
  res.redirect(longURL);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.userId;
  const urlId = req.params.id;

  if( !userId) {
    res.status(400).send('Please log in to create URLs<br><a href="/register">Register!!</a><br><a href="/login">Login!!</a>');
      return;
  }

  if (!urlDatabase[urlId]) {
    res.status(404).send("URL not found");
    return;
  }

  if (urlDatabase[urlId].userID !== userId) {
    res.status(403).send("You do not have permission to delete this URL");
    return;
  }

  delete urlDatabase[urlId];

  res.redirect('/urls/');
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.longURL;
  const userId = req.session.userId;
  const urlId = req.params.id;

  if( !userId) {
    res.status(400).send('Please log in to create URLs<br><a href="/register">Register!!</a><br><a href="/login">Login!!</a>');
      return;
  }

  if (!urlDatabase[urlId]) {
    res.status(404).send("URL not found");
    return;
  }

  if (urlDatabase[urlId].userID !== userId) {
    res.status(403).send("You do not have permission to edit this URL");
    return;
  }

  urlDatabase[id].longURL = newURL;
  res.redirect('/urls/');
});

app.post("/login", (req, res) => {
  const email = req.body.email;

  if (email.length === 0 || req.body.password.length === 0) {
    res.status(400).send("Empty Username or Password");
    return;
  }

  const user = getUserByEmail(email);
  
  if (user === null) {
    console.log("User not found");
    res.status(403).send("User not found");
    return;
  }
  
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    console.log("Incorrect password");
    res.status(403).send("Incorrect Password");
    return;
  }
  req.session.userId = user.id;
  res.redirect('/urls');
});
    

app.post("/logout", (req, res) => {
  req.session.userId = null;
  res.redirect('/login');
});

app.get("/register", (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    res.redirect('/urls');
    return;
  } else {
  const templateVars = {
    currentUser: users[userId],
    urls: urlDatabase
  };
  res.render("register.ejs", templateVars);
}
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  const id = generateRandomString();

  if (email.length === 0 || password.length === 0) {
    res.status(400).send("Empty Username or Password");
    return;
  }

  if (getUserByEmail(email) === null) {
    const newUser = {
      id,
      email,
      password
    };

    users[id] = newUser;
    console.log(users);
    res.redirect('/login');
  } else {
    res.status(400).send("User with the same email already exists");
  }
});

app.get("/login", (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    res.redirect('/urls');
    return;
  } else {
    const templateVars = {
      currentUser: users[userId],
      urls: urlDatabase
    };
    res.render("login.ejs", templateVars);
  }
});