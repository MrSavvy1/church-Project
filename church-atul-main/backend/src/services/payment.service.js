const request = require('request');
const Payment = require('../models/transaction.model');
const _ = require('lodash');
const { initializePayment, verifyPayment } = require('../../utils/payment')(request);

class PaymentService {
    startPayment(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const form = _.pick(data, ["userId", "churchId", "email", "amount", "type", "projectId"]);
                form.metadata = {
                    userId: form.userId,
                    churchId: form.churchId
                };
                form.amount *= 100;
                form.callback_url = 'https://church-project-5f1j.onrender.com/#/login';

                initializePayment(form, (error, body) => {
                    if (error) {
                        reject(error.message);
                    }
                    const response = JSON.parse(body);

                    // Include additional data in the response
                    response.userId = form.userId;
                    response.churchId = form.churchId;
                    response.email = form.email;
                    response.amount = form.amount / 100; // Convert back to original amount
                    response.type = form.type;
                    response.projectId = form.projectId;

                    return resolve(response);
                });

            } catch (error) {
                error.source = 'Start Payment Service';
                return reject(error);
            }
        });
    }

    createPayment(req) {
        const ref = req.reference;
        if (ref == null) {
            return Promise.reject({ code: 400, msg: 'No reference passed in query!' });
        }
        return new Promise(async (resolve, reject) => {
            try {
                verifyPayment(ref, (error, body) => {
                    if (error) {
                        reject(error.message);
                    }
                    const response = JSON.parse(body);
                    const { reference, amount, status } = response.data;
                    const { email } = response.data.customer;
                    const userId = response.data.metadata.userId;
                    const newPayment = { reference, amount, email, userId, status };
                    const payment = Payment.create(newPayment);
                    return resolve(payment);
                });
            } catch (error) {
                error.source = 'Create Payment Service';
                return reject(error);
            }
        });
    }

    paymentReceipt({ reference }) {
        return new Promise((resolve, reject) => {
            verifyPayment(reference, (error, body) => {
                if (error) {
                    reject(error);
                }
                const response = JSON.parse(body);
                if (!response.status) {
                    reject(new Error('Transaction not found'));
                }
                resolve(response);
            });
        });
    }
}

module.exports = PaymentService;