// Import required modules
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");

//Helper functions
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Cookie session configuration
const cookieSessionConfig = cookieSession({
  name: 'myCookieSession',
  keys: ['my-secret-word'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours,
});
app.use(cookieSessionConfig);

// Sample database for storing shortened URLs and their corresponding userIDs
const urlDatabase = {
  //sample URLs
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    urlUserId: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    urlUserId: "aJ48lW",
  },
};

// Sample database for storing user information
const users = {
  
};

// Route for creating a new URL
app.get("/urls/new", (req, res) => {
  //checks if the user is logged in
  const userId = req.session.userId;
  if (!userId) {
    //if not logged in redirects user to log in page
    res.redirect('/login');
    return;
  } else {
    // If logged in, render the "urls_new" template with the current user's data.
    const templateVars = { currentUser: users[userId] };
    res.render("urls_new", templateVars);
  }
});

// Route for showing a specific URL and its details
app.get("/urls/:id", (req, res) => {
  // Get the user ID from the session
  const userId = req.session.userId;
  // Get the URL ID from the request parameters
  const urlId = req.params.id;
  if (!userId) {
    //if not logged in sends a 400 error and links to register and login route
    res.status(400).send('Please log in to view URLs<br><a href="/register">Register!!</a><br><a href="/login">Login!!</a>');
    return;
  }
  // Check if the URL exists in the database or if the user has permission to access it
  if (!urlDatabase[urlId] || urlDatabase[urlId].urlUserId !== userId) {
    // If the URL doesn't exist or the user doesn't have permission, send a 403 error
    res.status(403).send('You do not have permission to access this URL');
    return;
  }

  // Prepare the data for rendering the "urls_show" template
  const templateVars = {
    currentUser: users[userId],
    id: urlId,
    longURL: urlDatabase[req.params.id].longURL
  };
  // Render the "urls_show" template with the provided data
  res.render("urls_show", templateVars);
});

// Route for displaying all URLs associated with the logged-in user
app.get("/urls", (req, res) => {
  //checks if the user is logged in
  const userId = req.session.userId;
  //if not logged in sends a 400 error and links to register and login route
  if (!userId) {
    res.status(400).send('Please login to view URLs<br><a href="/register">Register!!</a><br><a href="/login">Login!!</a>');
    return;
  }
  //using helper function looks through urlDatabase for objects matching userId
  const userUrls = urlsForUser(userId,urlDatabase);
  // Prepare the data for rendering the "urls_index" template
  const templateVars = {
    currentUser: users[userId],
    urls: userUrls
  };
  // Render the "urls_index" template with the provided data
  res.render("urls_index", templateVars);
});

// Route for creating a new URL
app.post("/urls", (req, res) => {
  //checks if the user is logged in
  const userId = req.session.userId;
  //prevents non signed in users from making post request for url
  if (!userId) {
    res.send('Please login to create new tinyUrl');
    return;
  } else {
    //generates new unique key with helper function
    const newKey = generateRandomString();
    // // Adds the new URL to the urlDatabase with the generated key
    urlDatabase[newKey] = req.body;
    // Associates the URL with the current user's ID
    urlDatabase[newKey].urlUserId = userId;
    // Redirects the user to the page displaying the details of the new URL
    res.redirect(`/urls/${newKey}`);
  }
});

// Route for redirecting to the original URL when using a short URL
app.get("/u/:id", (req, res) => {
  // Retrieve the long URL associated with the provided short URL ID
  const longURL = urlDatabase[req.params.id].longURL;
  // Check if the user is logged in
  const userId = req.session.userId;
  const urlId = req.params.id;
  // Check if the short URL exists in the database and if the current user has permission to access it
  if (!urlDatabase[urlId] || urlDatabase[urlId].urlUserId !== userId) {
    res.status(403).send('You do not have permission to access this URL');
    return;
  }
  // If the long URL is undefined (not found in the database), send a 400 error with a relevant message
  if (longURL === undefined) {
    res.status(400).send("No such Url exists");
    return;
  } else {
    // Redirect the user to the original long URL
    res.redirect(longURL);
  }
});

// Route for deleting a URL
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.userId;
  const urlId = req.params.id;
  // Check if the user is logged in
  if (!userId) {
    res.status(400).send('Please log in to create URLs<br><a href="/register">Register!!</a><br><a href="/login">Login!!</a>');
    return;
  }
  // Check if the URL exists in the database
  if (!urlDatabase[urlId]) {
    res.status(404).send("URL not found");
    return;
  }
  // Check if the user owns the URL and has permission to delete it
  if (urlDatabase[urlId].urlUserId !== userId) {
    res.status(403).send("You do not have permission to delete this URL");
    return;
  }
  // Delete the URL from the database
  delete urlDatabase[urlId];
  // Redirect the user back to the list of URLs
  res.redirect('/urls/');
});

// Route for updating a URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.longURL;
  const userId = req.session.userId;
  const urlId = req.params.id;
  //checks if user is logged in
  if (!userId) {
    res.status(400).send('Please log in to create URLs<br><a href="/register">Register!!</a><br><a href="/login">Login!!</a>');
    return;
  }
  //checks database for matching url
  if (!urlDatabase[urlId]) {
    res.status(404).send("URL not found");
    return;
  }
  // Check if the user owns the URL and has permission to edit it
  if (urlDatabase[urlId].urlUserId !== userId) {
    res.status(403).send("You do not have permission to edit this URL");
    return;
  }
  //replaces urlDatabase longURL value with new inputed value
  urlDatabase[id].longURL = newURL;
  res.redirect('/urls/');
});

// Route for user login
app.post("/login", (req, res) => {
  //Was going to create password var for req.body.password for dry code but thought storing a password var was unsecure
  //Var assigning user input to email
  const email = req.body.email;
  //if user enters empty email or password input sends error
  if (email.length === 0 || req.body.password.length === 0) {
    res.status(400).send("Empty Username or Password");
    return;
  }
  //uses helper function to check database for registered user
  const user = getUserByEmail(email,users);
  // If the user is null (not found in the database), send a 403 error with a relevant message
  if (user === null) {
    res.status(403).send("User not found");
    return;
  }
  //using bcrypt comparing checks if inputed hashed password matches database password
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403).send("Incorrect Password");
    return;
  }
  //if user input matches database registration gives user cookie matching the user.id
  req.session.userId = user.id;
  //after login works redirects to url route
  res.redirect('/urls');
});

// Route for user login form
app.get("/login", (req, res) => {
  const userId = req.session.userId;
  //checking if user is logged in if they are login route is not needed and they are redirected to urls route
  if (userId) {
    res.redirect('/urls');
    return;
  } else {
    // Prepare the data for rendering the "login" template
    const templateVars = {
      currentUser: users[userId],
      urls: urlDatabase
    };
    // Render the "login" template with the provided data
    res.render("login.ejs", templateVars);
  }
});
    
// Route for user logout
app.post("/logout", (req, res) => {
  //sets userId cookie value to null 'deleting' it
  req.session.userId = null;
  //redirects user to login route
  res.redirect('/login');
});

// Route for user registration form
app.get("/register", (req, res) => {
  const userId = req.session.userId;
  //checking if user is logged in if they are register route is not needed and they are redirected to urls route
  if (userId) {
    res.redirect('/urls');
    return;
  } else {
    // Prepare the data for rendering the "register" template
    const templateVars = {
      currentUser: users[userId],
      urls: urlDatabase
    };
    //Render the "register" template with the provided data
    res.render("register.ejs", templateVars);
  }
});

// Route for user registration
app.post("/register", (req, res) => {
  // Assigns user input on email form to email var
  const email = req.body.email;
  //hashes user inputed password using bcrypt and assigns it to password var
  const password = bcrypt.hashSync(req.body.password, 10);
  //use helper function to generate randomized new id for user
  const id = generateRandomString();
  //if user enters empty email or password input sends error
  if (email.length === 0 || password.length === 0) {
    res.status(400).send("Empty Username or Password");
    return;
  }
  //uses helper function that looks to see if a user with that information already exists in the database
  if (getUserByEmail(email,users) === null) {
    // If the helper function returns null (not found in the database), add user profile to database
    const newUser = {
      id,
      email,
      password
    };

    users[id] = newUser;
    //after successful registration redirects user to login route
    res.redirect('/login');
    // if helper function returns anything else (found in the database) sends error
  } else {
    res.status(400).send("User with the same email already exists");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});