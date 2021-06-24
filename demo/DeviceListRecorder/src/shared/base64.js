import { Buffer } from 'buffer';

export const uint8FromBase64 = (data) => Buffer.from(data, 'base64')[0];
export const base64FromUint8 = (value) => Buffer.from([value]).toString('base64');
