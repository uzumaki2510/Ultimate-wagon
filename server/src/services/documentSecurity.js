const net = require('node:net');
const ApiError = require('../utils/ApiError');
const TYPES = ['Inspection Report', 'Gas Free Certificate', 'Fit Certificate', 'Repair Document', 'Wagon Image', 'Damage Image'];
function validateFile(buffer, mime) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > 5 * 1024 * 1024) throw ApiError.badRequest('Choose a non-empty file up to 5 MB');
  const signatures = {
    'application/pdf': buffer.subarray(0, 5).toString() === '%PDF-' && buffer.subarray(-1024).includes(Buffer.from('%%EOF')),
    'image/png': buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/jpeg': buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255,
  };
  if (!signatures[mime]) throw ApiError.badRequest('File content must match PDF, PNG or JPEG');
}
async function scan(buffer) {
  if (!process.env.CLAMAV_HOST) return 'quarantined';
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: process.env.CLAMAV_HOST, port: Number(process.env.CLAMAV_PORT || 3310) });
    let response = '';
    socket.setTimeout(15000, () => socket.destroy(new Error('Document scanner timed out')));
    socket.once('error', reject);
    socket.on('data', data => { response += data.toString(); if (response.length > 4096) socket.destroy(new Error('Invalid scanner response')); });
    socket.once('end', () => /: OK\0?\s*$/.test(response) ? resolve('clean') : / FOUND/.test(response) ? resolve('rejected') : reject(new Error('Document scanner did not return a clean result')));
    socket.once('connect', () => {
      socket.write('zINSTREAM\0');
      for (let offset = 0; offset < buffer.length; offset += 65536) {
        const part = buffer.subarray(offset, offset + 65536); const size = Buffer.alloc(4); size.writeUInt32BE(part.length); socket.write(size); socket.write(part);
      }
      socket.write(Buffer.alloc(4));
    });
  });
}
module.exports = { TYPES, validateFile, scan };
