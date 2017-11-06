#!/usr/bin/env node

'use strict';

var fs = require("fs");
var path = require("path");

var command, filename;
if (typeof process.env.npm_config_argv == 'string') {  
  var argvs = JSON.parse(process.env.npm_config_argv);
  var {original, remain} = argvs;
  if (original instanceof Array && original[0] == 'run') {
    command = original[1];
    filename = original[2];
  } else {
    command = remain[0];
    filename = remain[1];
  }
} else if (process.argv instanceof Array) {
  command = process.argv[2];
  filename = process.argv[3];
}

const commands = {
  'create-handler': () => {
      if (typeof filename != 'string') {
        error('Filename argument is not defined');
      }
      let newFilename = path.resolve(process.cwd(), filename + '.js');
      if (fs.existsSync(newFilename)) {
        error('File "' + filename + '.js" already exists');
      } 
      var content = fs.readFileSync(path.resolve(__dirname, 'template.js'), 'UTF-8');
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