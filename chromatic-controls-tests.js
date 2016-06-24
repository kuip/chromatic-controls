// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by chromatic-controls.js.
import { name as packageName } from "meteor/kuip:chromatic-controls";

// Write your tests here!
// Here is an example.
Tinytest.add('chromatic-controls - example', function (test) {
  test.equal(packageName, "chromatic-controls");
});
