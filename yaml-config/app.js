// The purpose of this example is to show that the object returned by the
// yaml-config module will be affected by the NODE_ENV variable.  If NODE_ENV
// is not set, yaml-config reads the "default" section of the config file and
// the "development" section.  If NODE_ENV is set to something else like
// "production", yaml-config reads the "default" section and whatever was
// specified as NODE_ENV.

// Invoke this script in the following ways and note the results.

// "node app.js" - settings has everything from default + everything from
// development

// "NODE_ENV=production node app.js" - settings has everything from default +
// everything from production

// "NODE_ENV=splarf node app.js" - settings has everything from default +
// everything from splarf

var config = require('yaml-config');

var settings = config.readConfig('config.yaml');

console.log(settings);
