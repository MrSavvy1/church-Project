const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const verifyToken = require('../middleware');
const superVerify = require('../middleware/super');
const subAdminVerify = require('../middleware/subadmin');

router.post('/create_payment', verifyToken, PaymentController.createTransaction);
router.get('/get_all_transactions', superVerify, PaymentController.getAllTransactions);
router.get('/get_all_transactions/:id', verifyToken, PaymentController.getAllTransaction);
router.get('/get_transaction_detail/:id', verifyToken, PaymentController.getTransactionDetail);
router.post('/get_search_transactions', verifyToken, PaymentController.searchTransactions);
router.post('/admin_get_transaction_list', subAdminVerify, PaymentController.adminGetTransactionList);

module.exports = router;