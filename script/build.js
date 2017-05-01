const PATH = "src"

module.exports = function () {
  var fs = require("fs")
    , path = require("path")
    , distFilePath = path.resolve(__dirname, "../build/app.js")
    , distMinFilePath = path.resolve(__dirname, "../build/app.min.js")
    , debugFilePath = path.resolve(__dirname, "../build/app.debug.js")
    , debugMsgFilePath = path.resolve(__dirname, "../build/debug.msg.js")
    , demoPath = path.resolve(__dirname, "../demo/app.js")
    , entranceFilePath = path.resolve(__dirname, `../${PATH}/index.js`)
    , encode = "utf-8"
    , flatedModules = {}
    , indent = "  "

    , babel = require("babel-core")
    , babelrc = {
      "presets": [["es2015", { loose: true }], "stage-0"]// set loose to make it work in ie8
    }
    , UglifyJS = require('uglify-js');

  function wrap(code, returnValue, shouldReturn = false, useVar = false, ignoreInnerReturnStatement = false) {
    if (shouldReturn) {
      return (
        `return (function() {
          ${code} 
          ${returnValue && !ignoreInnerReturnStatement ? `return ${returnValue}` : ""}
        } ());`
      )
    }
    return (
      `${returnValue ? `${useVar ? "var" : "const"} ${returnValue} =` : ""} (function() {
        ${code} 
        ${returnValue && !ignoreInnerReturnStatement ? `return ${returnValue}` : ""}
      } ());`
    )
  }


  function getImportPathFromImportStatement(statement) {
    return statement.replace(/(^[ \t]*import\s+\S+\s+from\s+)|(\s*;\s*$)|'|"/mg, "");
  }

  function getReturnValueFromExportStatement(statements) {
    if (!statements instanceof Array) {
      return "";
    }
    return (statements.shift() || "").replace(/(^[ \t]*export[ \t]+default[ \t]+)|(\s*;\s*$)|'|"/mg, "");
  }

  function getFileByPath(filePath, dir) {
    var string = ""
      , resolvedPath = path.resolve(dir, filePath)
      , truePath = null;
    try {
      truePath = resolvedPath + ".js";
      if (flatedModules[truePath]) {
        return "";
      }
      string = fs.readFileSync(truePath, encode, e => e)
    } catch (err) {
      // console.log(err)
      try {
        truePath = `${resolvedPath}${path.sep}index.js`;
        if (flatedModules[truePath]) {
          return "";
        }
        string = fs.readFileSync(truePath, encode, e => e);
      } catch (err) {
        throw err
      }
    }

    flatedModules[truePath] = true;

    return "//module " + truePath + " start: \n" +
      handleImportAndExport(string, path.resolve(truePath, "../")) +
      "\n//module " + truePath + " end\n";
  }



  const importStatementReg = /^[ \t]*import\s+\S+\s+from\s+\S+.*$/gm
    , exportdefaultStatementReg = /^[ \t]*export[ \t]+default.*$/gm

  function handleImportAndExport(file, dir, shouldReturn) {
    let importsStatements = file.match(importStatementReg) || []
      , exportdefaultStatements = file.match(exportdefaultStatementReg) || []
      , body = file.replace(importStatementReg, "").replace(exportdefaultStatementReg, "")
      , flatedImports = importsStatements.map(statement => {
        var filePath = getImportPathFromImportStatement(statement);
        return getFileByPath(filePath, dir);
      }).join("\n")
      , returnValue = getReturnValueFromExportStatement(exportdefaultStatements)
      , wrappedbody = wrap(body, returnValue, shouldReturn)

    return `
      ${flatedImports}
      ${wrappedbody}
    `
  }

  function compress(code) {
    return UglifyJS.minify(code, {
      fromString: true,
      screw_ie8: false,
      "ascii-only": true
    }).code;
  }

  var entrance = fs.readFileSync(entranceFilePath, encode, e => e)
    , joined = handleImportAndExport(
      entrance,
      path.resolve(entranceFilePath, "../"),
      true
    )
    , finalExportStatement = entrance.match(exportdefaultStatementReg) || []
    , finalReturnStatement = getReturnValueFromExportStatement(finalExportStatement)
    , wrapped = wrap(joined, finalReturnStatement, false, false, true);

  // transform with babel;
  let babeledResult = "";
  try {
    babeledResult = babel.transform(wrapped, babelrc);
  } catch (err) {
    console.log("babel fail", err);
    fs.writeFile(debugFilePath, wrapped, e => e);
    fs.writeFile(debugMsgFilePath, err, e => e);
    return;
  }

  let afterBabeled = babeledResult.code;

  let finalWrapped = wrap(afterBabeled, finalReturnStatement, false, true, false);

  // compress
  var compressedCode = compress(finalWrapped);

  // write to disk
  fs.writeFile(distMinFilePath, compressedCode, e => e);

  fs.writeFile(demoPath, finalWrapped, e => e);
  fs.writeFileSync(distFilePath, finalWrapped, e => e);
}