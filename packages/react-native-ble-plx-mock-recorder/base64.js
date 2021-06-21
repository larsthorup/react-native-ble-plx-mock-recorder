import { Buffer } from 'buffer';

/** @type {(data: string) => string} */
export const stringFromBase64 = (data) => Buffer.from(data, 'base64').toString('ascii');

/** @type {(value: string) => string} */
export const base64FromString = (value) => Buffer.from(value).toString('base64');

/** @type {(data: string) => Buffer} */
export const bufferFromBase64 = (data) => Buffer.from(data, 'base64');

/** @type {(data: string) => string} */
export const printableFromBase64 = (data) => stringFromBase64(data).replace(/[^ -~]/g, '?');

/** @type {(data: string) => boolean} */
export const isPrintableFromBase64 = (data) => base64FromString(printableFromBase64(data)) === data;
