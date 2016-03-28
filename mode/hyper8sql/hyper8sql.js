// Hyper8 SQL Highlighter and Autocomplete

/*
  Hyper8 SQL Mode: Properties of Mime Type (text/x-hyper8sql)
  =================================================
  keywords:
    A list of keywords to be highlighted.
  builtin:
    A list of builtin types to be highlighted.
  operatorChars:
    All characters to be highlighted as operators.
  atoms:
    Keywords that must be highlighted as atoms.
  hooks:
    Handle special tokens and highlight them.
*/

(function (mod) {
  if (typeof exports === 'object' && typeof module === 'object') // CommonJS
    mod(require('../../lib/codemirror'));
  else if (typeof define === 'function' && define.amd) // AMD
    define(['../../lib/codemirror'], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {

  // Define mime type `text/x-hyper8sql`
  (function () {
    'use strict';

    // convert array list to an object's properties
    function set(words) {
      var obj = {};
      words.forEach(function (val) {
        obj[val] = true;
      });
      return obj;
    }

    // variable token
    function hookVarFn(stream) {
      if (stream.match(/^[0-9a-zA-Z$\.\_]+/)) {
        return 'variable-2';
      }

      return null;
    }

    // hyper8 tokenizer creator
    function tokenCreatorForHyper8(hyper8Key) {
      return function (stream) {
        stream.eatWhile(/^[::\w]/);
        var word = stream.current();
        if (word.indexOf(hyper8Key) >= 0) {
          return 'variable-2';
        }

        return null;
      };
    }

    // H8::* token
    var hookHyper8VarFn = tokenCreatorForHyper8('H8::');

    // Q::* token
    var hookColVarFn = tokenCreatorForHyper8('Q::');

    // R::* token
    var hookCookBookVarFn = tokenCreatorForHyper8('R::');

    // hyper8 specific keywords
    var hyper8Keywords = ['H8::ROWID', 'R::ID', 'R::DATE', 'R::DATE::WEEK', 'R::DATE::MONTH', 'R::STATUS'];

    // hyper8 mime type definition
    CodeMirror.defineMIME('text/x-hyper8sql', {
      name: 'sql',
      keywords: set(['abs', 'alter', 'and', 'as', 'asc', 'avg', 'between', 'by', 'columnvalues', 'count', 'count', 'create', 'datediff', 'delete', 'desc', 'distinct', 'drop', 'from', 'geoip', 'group', 'group_concat', 'having', 'in', 'insert', 'int', 'into', 'is', 'join', 'like', 'limit', 'max', 'min', 'not', 'on', 'or', 'order', 'rand', 'round', 'select', 'set', 'stddev', 'sum', 'table', 'union', 'update', 'values', 'where'].concat(hyper8Keywords)),
      builtin: set(['bigint', 'bit', 'blob', 'bool', 'boolean', 'char', 'date', 'datetime', 'decimal', 'double', 'enum', 'float', 'float4', 'float8', 'int', 'int1', 'int2', 'int3', 'int4', 'int8', 'integer', 'long', 'longblob', 'longtext', 'medium', 'mediumblob', 'mediumint', 'mediumtext', 'numeric', 'precision', 'real', 'signed', 'text', 'time', 'timestamp', 'tinyblob', 'tinyint', 'tinytext', 'unsigned', 'varbinary', 'varchar', 'varcharacter', 'year']),
      atoms: set(['false', 'true', 'null', 'unknown']),
      operatorChars: /^[*+\-%<>!=]/,
      hooks: {
        '@': hookVarFn,
        'H': hookHyper8VarFn,
        'Q': hookColVarFn,
        'R': hookCookBookVarFn
      }
    });
  }());

  // define CreateEditor
  (function () {
    'use strict';
    // Returns the survey id
    function getSurveyId() {
      var el = document.querySelector('img[src="/images/UI/Skins/OneGfK/survey.png"]');
      var surveyId = el && el.nextSibling && el.nextSibling.textContent.match(/\d+/);
      return surveyId && surveyId.length ? surveyId[0] : '[surveryId]';
    }

    // Initializes and replaces the textarea with codemirror editor
    function CreateEditor(textareaEl) {
      var self = this;

      function handleEnter(cm) {
        self.convertWordLeftToUppercase(cm);
        return CodeMirror.Pass;
      }

      if (!textareaEl) {
        console.error('Textarea Element Not Found!');
        return null;
      }

      var tables = {};
      // TODO: add table column names?
      tables['RespondentAnswer_' + getSurveyId()] = [];

      // initialize editor
      var editor = CodeMirror.fromTextArea(textareaEl, {
        mode: 'text/x-hyper8sql',
        lineNumbers: true,
        autofocus: true,
        smartIndent: true,
        indentWithTabs: true,
        extraKeys: {
          Enter: handleEnter,
          'Ctrl-Space': 'autocomplete'
        },
        hintOptions: {
          tables: tables
        }
      });

      // listen for space
      editor.on('keypress', function (cm, evt) {
        if (evt.code === 'Space' || evt.code === 'Enter') {
          self.convertWordLeftToUppercase(cm);
        }
      });

      // listen for changed to codemirror editor and move content to original textarea element
      editor.on('change', function (cm) {
        var value = cm.getValue();
        textareaEl.value = value;
      });

      // collect keywords which will automatically be converted to uppercase
      this.toConvertKeywords = [].concat(Object.keys(CodeMirror.mimeModes['text/x-hyper8sql'].keywords))
        .concat(Object.keys(CodeMirror.mimeModes['text/x-hyper8sql'].builtin));

      // editor reference
      this.editor = editor;

      return this.editor;
    }

    // move cursor to left by one word
    CreateEditor.prototype.goWordLeft = function goWordLeft(cm) {
      return cm.moveH(-1, 'word');
    };

    // convert left word to uppercase if it matches one of the word in toConvertKeywords collection
    CreateEditor.prototype.convertWordLeftToUppercase = function convertWordLeftToUppercase(cm) {
      var cursor = cm.getCursor();
      this.goWordLeft(cm);
      var leftCursor = cm.getCursor();

      // get left word
      var word = cm.getRange(leftCursor, cursor);

      // check if the word match to that of in toConvertKeywords collection
      var index = this.toConvertKeywords.indexOf(word);
      if (index >= 0) {
        cm.replaceRange(this.toConvertKeywords[index].toUpperCase(), leftCursor, cursor);
      }

      // reset cursor
      return cm.setCursor(cursor);
    };

    // TODO: find better way to handle this
    window.CreateEditor = CreateEditor;
  }());

});
