co-logger
=========

Winston based logger for [compound.js](https://github.com/1602/compound)

Replace default CompoundJS logger with [Winston](https://github.com/flatiron/winston/)

Installation
============

Install using npm:

    npm install co-migration --save


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

