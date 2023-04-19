const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  xH6i8R: {
    id: "xH6i8R", 
    email: "purple@monkey.com", 
    password: "hey-look-there-dinosaur"
  },
  ue2m1D: {
    id: "ue2m1D", 
    email: "dishwasher@funk.com", 
    password: "i-dont-know-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail(testUsers, "purple@monkey.com")
    const expectedUserID = testUsers['xH6i8R'];
    assert.strictEqual(user, expectedUserID);
  });
it('should return undefined with invalid email', function() {
  const user = getUserByEmail(testUsers, "p@monk.com")
  const expectedUserID = undefined;
  assert.equal(user, expectedUserID);
});
});