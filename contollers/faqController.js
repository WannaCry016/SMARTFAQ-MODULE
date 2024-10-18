// backend/controllers/faqController.js
const axios = require('axios'); // Import axios to call the Python LLM service

// Get FAQ results and LLM-generated response
exports.getFaqs = async (req, res) => {
    const query = req.body.query;

    try {
        // Call the Python Flask service to get relevant FAQs
        const faqResponse = await axios.post('http://localhost:5000/faq', { query });
        const results = faqResponse.data.results; // Fetch results from FAQ service

        // Call the Python LLM service to generate a more detailed response
        const llmResponse = await axios.post('http://localhost:5000/llm-response', { query });
        const detailedResponse = llmResponse.data.response;

        // Return both FAQ results and LLM response
        res.json({ results, detailedResponse });
    } catch (error) {
        console.error('Error fetching FAQs or LLM response:', error);
        res.status(500).json({ error: 'Error fetching FAQs or LLM response' });
    }
};
