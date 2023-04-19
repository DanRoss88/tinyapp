

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
    if (userDB[user].email === email) {
      return userDB[user];
    }
   }
  return null; 
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

module.exports = { urlsForUser, getUserByEmail, generateRandomString };