// Wrapper so `nodemon server.js` (or `node server.js`) works from the BACKEND folder.
// It simply forwards to the actual entrypoint in `src/server.js`.
console.log('🔧 Wrapper server.js starting...');
console.log('🔧 Wrapper __dirname:', __dirname);
console.log('🔧 Wrapper process.cwd():', process.cwd());
require('./src/server.js');
