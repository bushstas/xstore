#!/usr/bin/env node

'use strict';

var fs = require("fs");
var path = require("path");
var argvs = JSON.parse(process.env.npm_config_argv);
var {remain} = argvs;
var [command, filename] = remain;


const commands = {
  'create-reducer': () => {
      let newFilename = path.resolve(process.cwd(), filename + '.js');
      if (fs.existsSync(newFilename)) {
        error('File "' + filename + '.js" already exists');
        process.exit();
      } 
      var content = fs.readFileSync(path.resolve(__dirname, 'template.js'));
      fs.writeFileSync(newFilename, content);
  }
};

if (commands[command] instanceof Function) {
  commands[command]();
}


function error(text) {
    console.log("\x1b[1m", "\x1b[31m", text);
    console.log("\x1b[37m", "\x1b[2m");
}