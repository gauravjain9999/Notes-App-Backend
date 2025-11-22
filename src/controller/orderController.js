const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: "YOUR_KEY_ID",
    key_secret: "YOUR_KEY_SECRET",
});

const options = {
    amount: 50000, // amount in paise = ₹500
    currency: "INR",
    receipt: "receipt#1'",
    payment_capture: 1
}

module.exports = {
    orderPlaced: async (req, res) => {
        try {
            const order = await razorpay.orders.create(options);
            res.json(order);
        }
        catch (error) {
            res.status(500).send(error);
        }
    },

    verifyPlaced: async (req, res) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = crypto
            .createHmac('sha256', 'YOUR_KEY_SECRET')
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (sign === razorpay_signature) {
            res.send("Payment verified successfully");
        } else {
            res.status(400).send("Invalid signature");
        }
    }
};

