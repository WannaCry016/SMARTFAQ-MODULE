const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const faqController = require('./controllers/faqController');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/faq', faqController.getFaqs);

app.post('/contact', (req, res) => {
    const { name, email, phone, message } = req.body;
    console.log(`Contact Form Submission: Name: ${name}, Email: ${email}, Phone: ${phone}, Message: ${message}`);
    res.status(200).json({ message: 'Message received successfully' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
