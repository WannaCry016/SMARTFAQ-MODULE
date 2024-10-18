// Debounce function for real-time FAQ search
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Function to fetch FAQs based on the user's query
async function searchFAQ(query) {
    const response = await fetch('/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        const error = await response.json();
        const resultsDiv = document.getElementById('faq-results');
        resultsDiv.innerHTML = `<p>${error.message || 'Error fetching FAQs'}</p>`;
        return null; // Return null if there's an error
    }

    return await response.json(); // Return the response data
}

// Function to handle input change and show suggestions
async function handleInputChange(event) {
    const query = event.target.value;
    const resultsDiv = document.getElementById('faq-results');

    if (query.length === 0) {
        resultsDiv.innerHTML = ''; // Clear results if input is empty
        return;
    }

    // Fetch FAQs based on the current input
    const data = await searchFAQ(query);

    // Ensure data is returned
    if (data && data.results.length > 0) {
        resultsDiv.innerHTML = `
            <h3>Relevant FAQs</h3>
            ${data.results.map(faq => `
                <div class="faq-item">
                    <h3>${faq.question}</h3>
                    <p>${faq.answer}</p>
                </div>
            `).join('')}
        `;
    } else {
        resultsDiv.innerHTML = `<p>No FAQs found for "${query}".</p>`; // Message for no results
    }
}

async function handleAIResponseButtonClick() {
    const query = document.getElementById('user-query').value;
    const llmResponseDiv = document.getElementById('llm-response');

    // Clear previous response
    llmResponseDiv.style.display = 'none'; // Hide initially
    llmResponseDiv.innerHTML = ''; // Clear previous content

    if (query.length === 0) {
        alert('Please enter a query before searching.'); // Alert if no input is given
        return; // Exit the function if there's no input
    }

    const data = await searchFAQ(query); // Perform the same search query when the button is clicked

    // Display LLM-generated response (only for button click)
    if (data && data.detailedResponse) {
        llmResponseDiv.innerHTML = `
            <div class="llm-response">
                <h3>Search Response:</h3>
                <p>${data.detailedResponse}</p>
            </div>
        `;
        llmResponseDiv.style.display = 'block'; // Show the response
    } else {
        llmResponseDiv.innerHTML = '<p>No detailed response from the AI Assistant.</p>';
        llmResponseDiv.style.display = 'block'; // Show the message
    }
}

// Attach the input event listener to the input field with debounce
const inputField = document.getElementById('user-query');
inputField.addEventListener('input', debounce(handleInputChange, 300));

// Attach the click event listener to the AI response button
document.getElementById('ai-response-button').addEventListener('click', handleAIResponseButtonClick);

// Handle contact form submission
document.getElementById('contact-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    // Send message to server
    const response = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message })
    });

    if (response.ok) {
        alert('Message sent successfully!');
        document.getElementById('contact-form').reset(); // Reset the form
    } else {
        alert('Error sending message. Please try again.');
    }
});
