/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Response } from 'express';

/**
 * Handles all http responses
 * @exports success
 * @exports fail
 */

/**
 * @param  {Object} res
 * @param  {Number} statusCode
 * @param  {String} type
 * @param {{ status: string; message: string; data: any } | string} data
 * @returns {Object} null
 */
export function success(
  res: Response,
  statusCode = 200,
  type = 'json',
  data: { status: string; message: string; data: any } | string
) {
  // const _data = {
  //   status: 'success',
  //   ...data
  // };
  // let responsePayload: { status: string; message: string; data: any } | string =_data;
  return res.status(statusCode).type(type).send(data);
}

/**
 * @param  {Object} res
 * @param  {Number} statusCode default is 500
 * @param  {String} message
 * @param {Object} data
 * @returns {Object} null
 */
export function fail(res: Response, statusCode = 400, type = 'json', data: any) {
  return res.status(statusCode).type(type).send(data);
}

//     return res.status(400).type('application/json').send({ message: err.message, status: 'error' });

//   'Borrowed' from isthisarealjob code :)
// -LeanKhan

export default {
  success,
  fail
};
