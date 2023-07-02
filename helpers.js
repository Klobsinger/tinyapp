// Helper function to find a user by their email in the given database.
// Parameters:
// - email: The email of the user to find (case-insensitive).
// - database: The database containing user information.
// Returns:
// - The user object if found, or null if the user is not found.
const getUserByEmail = function(email, database) {
  // Convert the email to lowercase for case-insensitive comparison.
  const lowerCaseEmail = email.toLowerCase();

  // Iterate through each user in the database.
  for (const userKey in database) {
    const user = database[userKey];
    const lowerCaseUserEmail = user.email.toLowerCase();

    // Check if the lowercase email matches the lowercase user email in the database.
    if (lowerCaseUserEmail === lowerCaseEmail) {
      // Return the user object if there's a match.
      return user;
    }
  }

  // If no matching user is found, return null.
  return null;
};

// Helper function to generate a random string
//Returns:
//- Random 6 character alphanumeric string
const generateRandomString = function() {
  //Var with all alphanumaric chars
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  // Generate a 6-character random string by looping 6 times.
  for (let i = 0; i < 6; i++) {
        // Generate a random index within the range of alphanumericChars.
    const randomIndex = Math.floor(Math.random() * alphanumericChars.length);
     // Append the character at the random index to the randomString.
    randomString += alphanumericChars.charAt(randomIndex);
  }
  // Return the 6-character random alphanumeric string.
  return randomString;
};

// Helper function to retrieve URLs associated with a specific user.
// Parameters:
// - id: User ID to match against the URLs' urlUserIds in the database.
// - database: An object representing the database of URLs, where each key is a unique URL identifier, and each value is an object containing URL details, including urlUserId.
// Returns:
// - An object containing URLs that belong to the specified user, indexed by their unique URL identifiers.
const urlsForUser = function(id, database) {
  // Starting with an empty object to store the user's URLs.
  const userUrls = {};

  // Iterate through each URL in the database.
  for (const urlKey in database) {
    // Check if the URL's urlUserId matches the specified id.
    if (database[urlKey].urlUserId === id) {
      // If the user owns the URL, add it to the userUrls object with its unique URL identifier as the key.
      userUrls[urlKey] = database[urlKey];
    }
  }

  // Return the object containing URLs that belong to the specified user.
  return userUrls;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };