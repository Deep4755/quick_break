// Wrapper so `nodemon server.js` (or `node server.js`) works from the BACKEND folder.
// It simply forwards to the actual entrypoint in `src/server.js`.
require('./src/server.js');
