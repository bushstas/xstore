#!/usr/bin/env node

'use strict';

var fs = require("fs");
var path = require("path");
var argvs = JSON.parse(process.env.npm_config_argv);
var {remain} = argvs;
var [command, filename] = remain;


const commands = {
  'create-reducer': () => {
      if (typeof filename != 'string') {
        error('Filename argument is not defined');
      }
      let newFilename = path.resolve(process.cwd(), filename + '.js');
      if (fs.existsSync(newFilename)) {
        error('File "' + filename + '.js" already exists');
      } 
      var content = fs.readFileSync(path.resolve(__dirname, 'template.js'));
      content = content.replace(/\{\{Name\}\}/g, filename.toUpperCase());
      fs.writeFileSync(newFilename, content);
  }
};

if (commands[command] instanceof Function) {
  commands[command]();
}


function error(text) {
    console.log("\x1b[1m", "\x1b[31m", text);
    console.log("\x1b[37m", "\x1b[2m");
    process.exit();
}