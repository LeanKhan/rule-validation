import express from 'express';
import bodyParser from 'body-parser';
import mustache from 'mustache';
import fs from 'fs';
import path from 'path';
import { isCelebrateError } from 'celebrate';
import { prettyPrintJson } from 'pretty-print-json';

import config from './config.json';
import respond from './respond';
import { getMessage, isValidJSON, dataType, handleArray, handleString, handleObject } from './helpers';
import { validatePayload } from './validation';

const app = express();
const PORT = process.env.PORT || 3000;
app.use((req, res, next) => {
  return bodyParser.json()(req, res, err => {
    if (err) {
      respond.fail(res, 400, 'json', { message: getMessage('invalid_json'), status: 'error', data: null });
      return;
    }
    next();
  });
});

// Setting mustachejs as view engine
// https://stackoverflow.com/questions/37901568/serving-static-files-in-express-with-mustache-templating
app.engine('html', function (filePath, options, callback) {
  fs.readFile(filePath, function (err, content) {
    if (err) return callback(err);
    const rendered = mustache.render(content.toString(), options);
    return callback(null, rendered);
  });
});

app.set('views', path.join(__dirname, './'));
app.set('view engine', 'html');

app.get('/', (req, res) => {
  try {
    const data = { message: getMessage('index'), status: 'success', data: config.me };

    const html = prettyPrintJson.toHtml(data, { quoteKeys: true });

    if (req.xhr || req.headers.accept.indexOf('text/html') == -1 || req.headers.accept.indexOf('json') > -1) {
      return respond.success(res, 200, 'json', data);
    } else {
      // send your normal response here
      return res.render('index', { json: html }, (err, html) => {
        if (err || !html) {
          return respond.fail(res, 400, 'json', {
            message: err.message || 'Could not render :/.',
            status: 'error',
            data: null
          });
        }

        if (html && !err) return respond.success(res, 200, 'html', html);
      });
    }
  } catch (err) {
    console.log('Error: ', err);
    return respond.fail(res, 400, 'json', { message: err.message, status: 'error', data: null });
  }
});

app.post('/validate-rule', isValidJSON, validatePayload, (req, res) => {
  try {
    const { rule, data } = req.body;

    let result: { result: boolean; value: string | number; field: string } = {
      result: false,
      value: null,
      field: null
    };

    try {
      switch (dataType(data)) {
        case 'string':
          result = handleString(data, rule.field, rule.condition, rule.condition_value);
          break;
        case 'object':
          result = handleObject(data, rule.field, rule.condition, rule.condition_value);
          break;
        case 'array':
          result = handleArray(data, rule.field, rule.condition, rule.condition_value);
          break;
      }
    } catch (failure) {
      result.result = false;
      return respond.success(res, 400, 'json', {
        message: failure.message,
        status: 'error',
        data: null
      });
    }

    const data_response = {
      validation: {
        error: !result.result,
        field: result.field,
        field_value: result.value,
        condition: rule.condition,
        condition_value: rule.condition_value
      }
    };

    if (result.result) {
      return respond.success(res, 200, 'json', {
        message: getMessage('validation_success', result.field),
        status: 'success',
        data: data_response
      });
    }

    return respond.fail(res, 400, 'json', {
      message: getMessage('validation_failure', result.field),
      status: 'error',
      data: data_response
    });
  } catch (err) {
    return respond.fail(res, 400, 'json', { message: err.message, status: 'error', data: null });
  }
});

app.all('*', (req, res) => {
  return res.status(404).send({ message: getMessage('404_route'), status: 'error', data: null });
});

// app.use(errors());
app.use((error, req, res, next) => {
  if (isCelebrateError(error)) {
    return res.status(400).json({
      message: error.details.get('body').message + '.',
      status: 'error',
      data: null
    });
  }

  return res.status(500).send({ message: error.message || getMessage('general_error'), status: 'error', data: null });
});

app.listen(PORT, () => {
  console.log('Rule-Validation API started successfully on port %s.', PORT);
});

// thank you Jesus!
