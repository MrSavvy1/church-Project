const mongoose = require('mongoose');

const rolechema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    church: [
        {
            label: String,
            value: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Church'
            },
        }
    ],
    churchPermission: Boolean,
    notificationPermission: Boolean,
    transactionPermission: Boolean,
});

module.exports = mongoose.model('Role', rolechema);