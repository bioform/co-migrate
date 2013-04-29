co-migrate
=========

[compound.js](https://github.com/1602/compound) migrations extension based on [node-migrate](https://github.com/visionmedia/node-migrate)


Installation
============

Step 1. Install using npm:

    npm install co-migrate --save

Step 2. Add `co-migrate` to `config/autoload.js`, for example:

```javascript
module.exports = function (compound) {
    return [
        'ejs-ext',
        'jugglingdb',
        'seedjs',
        'co-logger',
        'co-migrate'
    ].map(require);
};
```


Usages
======

To create new migration step use:

    compound m create MyNewMigrationName

New migration file will be located in the "/migrations" folder.
"db" variable is available in your migration file.

Migration file example(for MongoDB adapter):


    exports.up = function(next){

      db.collection('Event', function(err, collection){

        if(err){
          console.log("Cannot get collection Event")
          next(err);
        } else {
          collection.ensureIndex( { "from": 1 }, function(err){
            next(err);
          });
        }
      });

    };

    exports.down = function(next){

      db.collection('Event', function(err, collection){

        if(err){
          console.log("Cannot get collection Event")
          next(err);
        } else {
          collection.dropIndex( { "from": 1 }, function(err){
            next(err);
          });
        }
      });

    };


To run migrations use:

    compound m up

To roll back all migrations use:

    compound m down

You can specify migration name for "up" and "down" commands.

Don't forget to add "/migrations/.migrate" file to ".gitignore"

