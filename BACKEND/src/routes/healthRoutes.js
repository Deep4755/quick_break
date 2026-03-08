const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'QuickBreak backend is running 🚀'
  });
});

module.exports = router;
