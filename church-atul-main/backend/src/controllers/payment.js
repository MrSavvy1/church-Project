const PaymentService = require('../services/payment.service');
const Transaction = require('../models/transaction.model');
const Notification = require('../models/notification.model');
const Church = require('../models/church.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

const paymentInstance = new PaymentService();

exports.startPayment = async (req, res) => {
    try {
        const response = await paymentInstance.startPayment(req.body);

        const { userId, churchId, email, amount, type, projectId } = response;
        const { reference, access_code, authorization_url } = response.data;

        console.log('userId:', userId);
        console.log('churchId:', churchId);
        console.log('email:', email);
        console.log('amount:', amount);
        console.log('type:', type);
        console.log('projectId:', projectId);
        console.log('reference:', reference);
        console.log('access_code:', access_code);
        console.log('authorization_url:', authorization_url);

        if (!churchId) {
            return res.status(400).json({ status: "Failed", message: "churchId is required" });
        }

        console.log(`Looking for church with ID: ${churchId}`);
        const church = await Church.findById(new mongoose.Types.ObjectId(churchId));

        if (!church) {
            console.log(`Church not found for ID: ${churchId}`);
            return res.status(404).json({ status: "Failed", message: "Church not found" });
        }

        const newUser = await User.findById(userId);
        setTimeout(async () => {
            const paymentResponse = await exports.getPayment({
                query: {
                    reference,
                    userId,
                    churchId,
                    projectId,
                    amount,
                    type,
                    email,
                    redirect: true
                }
            }, res);

            // Capture the reply value and redirect URL
            const { reply, redirectUrl } = paymentResponse;

            // Modify the authorization_url based on the reply value
            const finalAuthorizationUrl = reply === "Successful" ? 'https://church-project-5f1j.onrender.com/#/login' : authorization_url;

            // Send the redirect URL in the response
            if (reply === "Successful") {
                res.status(200).json({ status: "Success", redirectUrl: finalAuthorizationUrl });
                console.log(`Redirecting to church home page for user ${userId}`);
                console.log(`Redirecting to church home page for user `, redirectUrl);
            } 
        }, 120000);

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ status: "Failed", message: error.message });
        }
    }
};

exports.createPayment = async (req, res) => {
    try {
        const response = await paymentInstance.createPayment(req.query);
        res.status(201).json({ status: "Success", data: response });
    } catch (error) {
        res.status(500).json({ status: "Failed", message: error.message });
    }
};

exports.getPayment = async (req, res) => {
    try {
        const { reference, userId, churchId, projectId, amount, type, email, redirect } = req.query;
        console.log('Received reference:', reference);
        console.log('Redirect value:', redirect, 'Type:', typeof redirect);
        if (!reference) {
            return res.status(400).json({ status: "Failed", message: "Reference is required" });
        }

        const paystackResponse = await paymentInstance.paymentReceipt({ reference });

        if (!paystackResponse || !paystackResponse.data) {
            return res.status(404).json({ status: "Failed", message: "Transaction not found" });
        }

        const reply = paystackResponse.data.status === 'success' ? 'Successful' : 'Failed';
        console.log('Paystack response:', paystackResponse.data.status);
        const notificationTitle = reply === 'Successful' ? 'Transaction Successful' : 'Transaction Failed';
        const notificationDescription = reply === 'Successful'
            ? `Your $${amount} ${type} transaction has been successfully completed. Paystack response is ${paystackResponse.data.status}`
            : `Your $${amount} ${type} transaction process is ${paystackResponse.data.status}`;

        await Notification.create({
            userId: userId,
            notificationTitle: notificationTitle,
            notificationType: 'User',
            createdDate: new Date(),
            description: notificationDescription,
            status: true
        });

        console.log('Notification created...:', Notification);

        if (reply === 'Successful') {
            const newTransaction = await Transaction.create({
                userId: userId,
                churchId: churchId,
                projectId: projectId ? new mongoose.Types.ObjectId(projectId) : null,
                amount: amount,
                createdDate: new Date(),
                type: type,
                status: reply,
                email: email,
                reference: reference
            });
            console.log('Transaction created:', newTransaction);
        }

        console.log('Redirecting to the homepage...');
        if (redirect === true) {
            const redirectUrl = reply === 'Successful'
                ? 'https://church-project-5f1j.onrender.com/#/login'
                : 'https://church-project-5f1j.onrender.com/#/signup';
            return { status: "Success", reply: reply, redirectUrl: redirectUrl };
        } else {
            return { status: "Success", reply: reply };
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ status: "Failed", message: error.message });
        } else {
            console.error('Error after headers sent:', error);
        }
        return { status: "Failed", message: error.message };
    }
};