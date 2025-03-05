require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

// APP config
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

// DB config
mongoose.connect('mongodb://localhost:27017/reminderAppDB')
    .then(() => console.log("DB connected"))
    .catch(err => console.log(err));

const reminderSchema = new mongoose.Schema({
    reminderMsg: String,
    remindAt: String,
    isReminded: Boolean
})

const Reminder = mongoose.model("reminder", reminderSchema)

// Whatsapp reminding functionality
setInterval(async () => {
    try {
        const reminderList = await Reminder.find({});
        if (reminderList) {
            reminderList.forEach(async reminder => {
                if (!reminder.isReminded) {
                    const now = new Date();
                    if ((new Date(reminder.remindAt) - now) < 0) {
                        await Reminder.findByIdAndUpdate(reminder._id, { isReminded: true });

                        const accountSid = process.env.ACCOUNT_SID;
                        const authToken = process.env.AUTH_TOKEN;
                        const client = require('twilio')(accountSid, authToken);

                        client.messages
                            .create({
                                body: reminder.reminderMsg,
                                from: 'whatsapp:+14155238886',
                                to: 'whatsapp:+919992288258' //YOUR PHONE NUMBER
                            })
                            .then(message => console.log(message.sid))
                            .done();
                    }
                }
            });
        }
    } catch (err) {
        console.log(err);
    }
}, 1000);

// API routes
app.get("/getAllReminder", async (req, res) => {
    try {
        const reminderList = await Reminder.find({});
        res.send(reminderList);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
})

app.post("/addReminder", async (req, res) => {
    const { reminderMsg, remindAt } = req.body;
    const reminder = new Reminder({
        reminderMsg,
        remindAt,
        isReminded: false
    });

    try {
        await reminder.save();
        const reminderList = await Reminder.find({});
        res.send(reminderList);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error adding reminder");
    }
})

app.post("/deleteReminder", async (req, res) => {
    try {
        await Reminder.deleteOne({ _id: req.body.id });
        const reminderList = await Reminder.find({});
        res.send(reminderList);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error deleting reminder");
    }
})

app.listen(9000, () => console.log("Server started"))
