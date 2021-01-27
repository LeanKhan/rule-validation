import express from 'express';
import bodyParser from 'body-parser';
import mustache from 'mustache';
import fs from 'fs';
import path from 'path';
import { celebrate, Joi, Segments, errors, isCelebrateError } from 'celebrate';

import { prettyPrintJson } from 'pretty-print-json';

import config from './config.json';
import respond from './respond';

const app = express();
const PORT = process.env.PORT || 3000;
app.use((req, res, next) => {
  return bodyParser.json()(req, res, err => {
    if (err) {
      respond.fail(res, 400, 'json', { message: 'Invalid JSON payload passed.', status: 'error', data: null });
      return;
    }
    next();
  });
});

function testJSON(text) {
  if (typeof text == 'object') {
    return true;
  }

  try {
    const o = JSON.parse(text);

    if (o && typeof o === 'object') {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

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
    const data = { status: 'success', message: 'My Rule-Validation API', data: config.me };

    const html = prettyPrintJson.toHtml(data, { quoteKeys: true });

    if (req.xhr || req.headers.accept.indexOf('text/html') == -1 || req.headers.accept.indexOf('json') > -1) {
      // send your xhr response here
      return respond.success(res, 200, 'json', data);
    } else {
      // send your normal response here
      return res.render('index', { json: html }, (err, html) => {
        if (err || !html) {
          return respond.fail(res, 400, 'json', { message: err.message || 'Could not render :/', status: 'error' });
        }

        if (html && !err) {
          return respond.success(res, 200, 'html', html);
        }
      });
    }
  } catch (err) {
    console.log('Error: ', err);
    return respond.fail(res, 400, 'json', { message: err.message, status: 'error', data: null });
  }
});

const isValidJSON = (req, res, next) => {
  if (!req.body)
    return respond.fail(res, 400, 'json', { message: 'Request body is required.', status: 'error', data: null });
  console.log(req.body);
  if (testJSON(req.body)) {
    return next();
  } else {
    return respond.fail(res, 400, 'json', { message: 'Invalid JSON payload passed.', status: 'error', data: null });
  }
};

const ruleSchema = {
  [Segments.BODY]: Joi.object().keys({
    rule: Joi.object()
      .keys({
        field: Joi.string().required(),
        condition: Joi.string().valid('eq', 'neq', 'gt', 'gte', 'contains').required(),
        condition_value: Joi.alternatives(Joi.string(), Joi.number()).required()
      })
      .required(),
    data: Joi.alternatives(Joi.object(), Joi.string(), Joi.array()).required()
  })
};

function dataType(data: any) {
  if (typeof data == 'string') {
    return 'string';
  } else if (typeof data == 'object') {
    return 'object';
  } else if (typeof data.length) {
    return 'array';
  }
}

function handleString(data: any, field: string, condition: string, condition_value: string | number) {
  switch (condition) {
    case 'eq':
      return data[field] === condition_value;
    default:
      return false;
  }
}

function handleObject(data: any, field: string, condition: string, condition_value: string | number) {
  switch (condition) {
    case 'eq':
      return data[field] === condition_value;
    case 'gt':
      return data[field] > condition_value;
    case 'neq':
      return data[field] != condition_value;
    case 'gte':
      return data[field] >= condition_value;
    case 'contains':
      return data.includes(condition_value);
    default:
      return false;
  }
}

function handleArray(data: any[], field: string, condition: string, condition_value: string | number) {
  switch (condition) {
    case 'eq':
      return data[field] === condition_value;
    case 'gt':
      return data[field] > condition_value;
    case 'neq':
      return data[field] != condition_value;
    case 'gte':
      return data[field] >= condition_value;
    case 'contains':
      return data.includes(condition_value);
    default:
      return false;
  }
}

app.post('/validate-rule', isValidJSON, celebrate(ruleSchema), (req, res) => {
  try {
    const { rule, data } = req.body;

    if (typeof data == 'string') {
      console.log(data.charAt(parseInt(rule.field)));
    } else {
      console.log(data[rule.field]);
    }

    let result;

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

    // switch (rule.condition) {
    //   case 'eq':

    //     break;
    //     case 'neq':

    //     break;
    //     case 'gt':

    //     break;
    //     case 'gte':

    //     break;
    //     case 'contains':

    //     break;

    //   default:
    //     break;
    // }

    return respond.success(res, 200, 'json', { status: 'success', message: 'Ya!', data: result });
  } catch (err) {
    return respond.fail(res, 400, 'json', { message: err.message, status: 'error', data: null });
  }
});

// app.use(errors());
app.use((error, req, res, next) => {
  if (isCelebrateError(error)) {
    //if joi produces an error, it's likely a client-side problem
    // console.log(JSON.stringify(error.details.get('body')));

    // console.log(JSON.stringify(error.details.get('body').details));

    return res.status(400).json({
      message: error.details.get('body').message,
      status: 'error',
      data: null
    });
  } //otherwise, it's probably a server-side problem.
  return res.status(500).send(error);
});

app.listen(PORT, () => {
  console.log('Rules Validation server started successfully on port %s', PORT);
});

// thank you Jesus!
