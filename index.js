var migrate = require('migrate')
  , join = require('path').join
  , fs = require('fs');

obj = new Object();

obj.init = function(compound) {
    var app = compound.app;
    var options = {args: []};

    /**
     * Migration template.
     */

    var template = [
        ''
      , 'exports.up = function(next){'
      , '  // "db" variable is available. Use it if you need direct connection to DB'
      , '  next();'
      , '};'
      , ''
      , 'exports.down = function(next){'
      , '  next();'
      , '};'
      , ''
    ].join('\n');

    var commands = {

      /**
       * up [name]
       */

      up: function(migrationName, callback){
        if(!callback) {
          callback = migrationName;
          migrationName = null;
        }
        performMigration('up', migrationName, callback);
      },

      /**
       * down [name]
       */

      down: function(migrationName, callback){
        if(!callback) {
          callback = migrationName;
          migrationName = null;
        }
        performMigration('down', migrationName, callback);
      },

      /**
       * create [title]
       */

      create: function(){
        var args = [].slice.call(arguments);
        var callback = args.pop();
        var migrations = fs.readdirSync('migrations').filter(function(file){
          return file.match(/^\d+/);
        }).map(function(file){
          return parseInt(file.match(/^(\d+)/)[1], 10);
        }).sort(function(a, b){
          return a - b;
        });

        var curr = pad((migrations.pop() || 0) + 1)
          , title = slugify(args.join(' '));
        title = title ? curr + '-' + title : curr; 
        create(title, callback);
      }
    };

    compound.tools.migrate = function() {
        var action = process.argv[3] || 'up';
        if( process.argv.length > 4 ){
            options.args.push(process.argv[4])
        }
        switch (action) {
            case 'up':
            case 'down':
            case 'create':
            perform(action, process.exit);
            break;
            default:
            console.log('Unknown action', action);
            process.exit();
            break;
        }
    };

    compound.tools.migrate.help = {
        shortcut:    'm',
        usage:       'migrate [up|down|create] [name]',
        description: 'Run migrations for database'
    };

    function getUniqueSchemas() {
        var schemas = [];
        Object.keys(compound.models).forEach(function (modelName) {
            var Model = compound.models[modelName];
            var schema = Model.schema;
            if (!~schemas.indexOf(schema)) {
                schemas.push(schema);
            }
        });
        return schemas;
    }

    function perform(action, callback) {

        options.args.push(callback);
        var wait = 0;

        try {
          fs.mkdirSync('migrations', 0774);
        } catch (err) {
          // ignore
        }

        var schemas = getUniqueSchemas();

        if(schemas.length > 0){
            var schema = schemas[0];
            wait += 1;
            process.nextTick(function () {
                var counter = 5;
                var func = function(){
                  if( schema.adapter.client ){
                    // invoke command
                    global.db = schema.adapter.client
                    command = commands[action];
                    command.apply(this, options.args);
                  } else if(--counter === 0){
                    done();
                  } else {
                    setTimeout(func, 1000);
                  }
                };
                setTimeout(func, 1000);

            });
        }

        if (wait === 0) done();

        function done() {
            if (--wait <= 0) callback();
        }
    }

    /**
     * Load migrations.
     */

    function migrations() {
      return fs.readdirSync('migrations').filter(function(file){
        return file.match(/^\d+.*\.js$/);
      }).sort().map(function(file){
        return 'migrations/' + file;
      });
    }
    /**
     * Log a keyed message.
     */

    function log(key, msg) {
      console.log('  \033[90m%s :\033[0m \033[36m%s\033[0m', key, msg);
    }

    /**
     * Slugify the given `str`.
     */

    function slugify(str) {
      return str.replace(/\s+/g, '-');
    }

    /**
     * Pad the given number.
     *
     * @param {Number} n
     * @return {String}
     */

    function pad(n) {
      return Array(4 - n.toString().length).join('0') + n;
    }

    /**
     * Create a migration with the given `name`.
     *
     * @param {String} name
     */

    function create(name, callback) {
      var path = 'migrations/' + name + '.js';
      log('create', join(process.cwd(), path));
      fs.writeFileSync(path, template);
      callback();
    }

    /**
     * Perform a migration in the given `direction`.
     *
     * @param {Number} direction
     */

    function performMigration(direction, migrationName, callback) {
      migrate('migrations/.migrate');
      migrations().forEach(function(path){
        var mod = require(process.cwd() + '/' + path);
        migrate(path, mod.up, mod.down);
      });

      var set = migrate();

      set.on('migration', function(migration, direction){
        log(direction, migration.title);
      });

      set.on('save', function(){
        log('migration', 'complete');
      });

      var migrationPath = migrationName
        ? join('migrations', migrationName)
        : migrationName;
     
      set[direction](function(err){
        if(err) console.log("Error: ", err);
        callback();
      }, migrationPath);
    }

};

module.exports = obj;
