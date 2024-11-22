// routes/index.js
const express = require('express');
const router = express.Router();
const SaveController = require('../controllers/saveController');
const LoadController = require('../controllers/loadController');
const UploadController = require('../controllers/uploadController');
const DeleteController = require('../controllers/deleteController');
const UploadService = require('../services/uploadService');

const upload = UploadService.initializeUploadMiddleware();

router.get('/api/saved-page', LoadController.getSavedPage);
router.get('/api/get-links', LoadController.getLinks);
router.post('/api/save-link', SaveController.saveLink);
router.post('/api/upload-files', upload.array('files'), UploadController.uploadFiles);
router.delete('/api/delete-website/:websiteId', DeleteController.deletePage);

module.exports = router;
