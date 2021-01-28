import respond from './respond';

type MessageType =
  | 'index'
  | 'missing_field'
  | 'invalid_json'
  | 'validation_success'
  | 'validation_failure'
  | 'invalid_field'
  | 'bad_condition'
  | '404_route'
  | 'general_error';

export function getMessage(type: MessageType, input?: string): string {
  switch (type) {
    case 'index':
      return 'My Rule-Validation API.';
    case 'invalid_json':
      return 'Invalid JSON payload passed.';
    case 'missing_field':
      return `field ${input} is missing from data.`;
    case 'validation_success':
      return `field ${input} successfully validated.`;
    case 'validation_failure':
      return `field ${input} failed validation.`;
    case 'invalid_field':
      return `field key ${input} is invalid.`;
    case 'bad_condition':
      return `condition ${input} not supported for strings.`;
    case '404_route':
      return 'That route does not exist.';
    case 'general_error':
      return 'Ye! Something just happen right now.';
    default:
      break;
  }
}

export function testJSON(text) {
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

export function isValidJSON(req, res, next) {
  if (!req.body)
    return respond.fail(res, 400, 'json', { message: 'Request body is required.', status: 'error', data: null });
  if (testJSON(req.body)) {
    return next();
  } else {
    return respond.fail(res, 400, 'json', { message: 'Invalid JSON payload passed.', status: 'error', data: null });
  }
}

export function dataType(data: any) {
  if (typeof data == 'string') {
    return 'string';
  } else if (Array.isArray(data)) {
    return 'array';
  } else if (typeof data == 'object') {
    return 'object';
  }
}

export function parseField(field: string) {
  return field.split('.');
}

function evaluate(
  value: any,
  condition: string,
  condition_value: any,
  field: string,
  type: 'string' | 'object' | 'array'
): { result: boolean; value: string | number; field: string } {
  let result = false;

  if (type == 'string') {
    switch (condition) {
      case 'eq':
        result = value === condition_value;
        break;
      case 'neq':
        result = value !== condition_value;
        break;
      // case 'contains':
      //   console.log(value, condition_value);
      //   result = value.includes(condition_value);
      //   break;
      default:
        throw new Error(getMessage('bad_condition', condition));
    }
  } else {
    switch (condition) {
      case 'eq':
        // if (typeof value != 'number' && typeof condition_value != 'number')
        //   throw new Error(`${value} and ${condition_value} must both be numbers for condition ${condition}.`);
        result = value === condition_value;
        break;
      case 'gt':
        if (typeof value != 'number' && typeof condition_value != 'number')
          throw new Error(`${value} and ${condition_value} must both be numbers for condition ${condition}.`);
        result = value > condition_value;
        break;
      case 'neq':
        result = value !== condition_value;
        break;
      case 'gte':
        if (typeof value != 'number' && typeof condition_value != 'number')
          throw new Error(`${value} and ${condition_value} must both be numbers for condition ${condition}.`);
        result = value >= condition_value;
        break;
      case 'contains':
        if (Array.isArray(value)) {
          result = value.includes(condition_value);
        } else if (
          typeof value == 'object' &&
          (typeof condition_value == 'string' || typeof condition_value == 'number')
        ) {
          result = value.hasOwnProperty(condition_value);
        } else if (typeof value == 'string') {
          result = value.includes(condition_value);
        } else {
          result = false;
        }
        break;
      default:
        result = false;
        break;
    }
  }

  return { result, value, field };
}

export function handleString(
  data: string,
  field: string,
  condition: string,
  condition_value: string | number
): { result: boolean; value: string | number; field: string } {
  if (field && !data[field]) throw new Error(getMessage('missing_field', field));

  return evaluate(data[field], condition, condition_value, field, 'string');
}

export function handleObject(
  data: Record<string, any>,
  field: string,
  condition: string,
  condition_value: string | number
): { result: boolean; value: string | number; field: string } {
  const field_s = parseField(field);

  if (field_s.length > 2) throw new Error(`field ${field} must not be more than two-levels deep.`);

  if (field_s.length > 1) {
    if (field_s[1] == '.' || field[1] == '') throw new Error(getMessage('invalid_field', field));

    // if the two types are not same...

    if (!data[field_s[0]]) throw new Error(getMessage('missing_field', field_s[0]));

    if (!data[field_s[0]][field_s[1]]) throw new Error(getMessage('missing_field', field));

    return evaluate(data[field_s[0]][field_s[1]], condition, condition_value, field, 'object');
  }

  if (field && !data[field]) throw new Error(getMessage('missing_field', field));

  return evaluate(data[field], condition, condition_value, field, 'object');

  // TODO: add type checks! SO that we don't do stupid things :)
}

export function handleArray(
  data: any[],
  field: string,
  condition: string,
  condition_value: string | number
): { result: boolean; value: string | number; field: string } {
  const field_s = parseField(field);

  if (field_s.length > 2) throw new Error(`field ${field} must not be more than two-levels deep.`);

  if (field_s.length > 1) {
    if (field_s[1] == '.' || field[1] == '') throw new Error(getMessage('invalid_field', field));

    // if the two types are not same...

    if (!data[field_s[0]]) throw new Error(getMessage('missing_field', field_s[0]));

    if (!data[field_s[0]][field_s[1]]) throw new Error(getMessage('missing_field', field));

    return evaluate(data[field_s[0]][field_s[1]], condition, condition_value, field, 'object');
  }

  if (field && !data[field]) throw new Error(getMessage('missing_field', field));

  return evaluate(data[field], condition, condition_value, field, 'array');
}
