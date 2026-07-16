const apiResponse = require('./apiResponse');
const paginationHelper = require('./paginationHelper');
const slugGenerator = require('./slugGenerator');
const dateHelper = require('./dateHelper');
const stringHelper = require('./stringHelper');
const fileHelper = require('./fileHelper');
const ipHelper = require('./ipHelper');

module.exports = {
  ...apiResponse,
  ...paginationHelper,
  ...slugGenerator,
  ...dateHelper,
  ...stringHelper,
  ...fileHelper,
  ...ipHelper
};