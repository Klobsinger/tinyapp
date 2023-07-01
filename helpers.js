const getUserByEmail = function(email, database) {
  const lowerCaseEmail = email.toLowerCase();
  for (const userKey in database) {
    const user = database[userKey];
    const lowerCaseUserEmail = user.email.toLowerCase();
    if (lowerCaseUserEmail === lowerCaseEmail) {
      return user;
    }
  }
  return null;
};

module.exports = { getUserByEmail };