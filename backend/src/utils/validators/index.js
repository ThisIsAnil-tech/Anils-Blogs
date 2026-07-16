const authValidator = require('./authValidator');
const blogValidator = require('./blogValidator');
const commentValidator = require('./commentValidator');
const subscriberValidator = require('./subscriberValidator');
const mediaValidator = require('./mediaValidator');
const categoryValidator = require('./categoryValidator');
const tagValidator = require('./tagValidator');
const searchValidator = require('./searchValidator');
const settingsValidator = require('./settingsValidator');

module.exports = {
  ...authValidator,
  ...blogValidator,
  ...commentValidator,
  ...subscriberValidator,
  ...mediaValidator,
  ...categoryValidator,
  ...tagValidator,
  ...searchValidator,
  ...settingsValidator
};