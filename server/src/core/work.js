const router = require('express').Router();
router.use(require('./tasks'));
router.use(require('./worklogs'));
module.exports = router;
