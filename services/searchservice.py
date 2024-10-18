import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils.textUtils import preprocess_text
import re
from flask import Flask, request, jsonify
import json
import numpy as np
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)

# Load FAQ data
with open('faq.json', 'r') as file:
    faqs = json.load(file)

questions = [faq['question'] for faq in faqs]
answers = [faq['answer'] for faq in faqs]

model = SentenceTransformer('all-MiniLM-L6-v2')
question_embeddings = model.encode(questions, convert_to_tensor=True)

def generate_response(retrieved_answers):
    # Simulate generating a response (replace with your model call)
    ai_response = ""
    for ans in retrieved_answers:
        ai_response += ans

    return ai_response

@app.route('/llm-response', methods=['POST'])
def get_llm_response():
    data = request.json
    user_question = data['query']
    
    sub_questions = [q.strip() for q in re.split(r'\s*,\s*|\s+(and|or)\s+', user_question)]
    combined_answers = []

    for sub_question in sub_questions:
        user_embedding = model.encode(sub_question, convert_to_tensor=True)
        cosine_scores = util.pytorch_cos_sim(user_embedding, question_embeddings)[0]
        best_match_index = np.argmax(cosine_scores)
        best_match_score = cosine_scores[best_match_index]

        if best_match_score > 0.5:
            combined_answers.append(answers[best_match_index])
        else:
            combined_answers.append("I'm sorry, I don't have an answer to that question.")
    
    llm_response = generate_response(combined_answers)
    return jsonify({'response': llm_response})

from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from sentence_transformers import util

# Initialize the TF-IDF vectorizer
tfidf_vectorizer = TfidfVectorizer(stop_words='english')
faq_tfidf_matrix = tfidf_vectorizer.fit_transform(questions)  # Fit TF-IDF on FAQ questions

@app.route('/faq', methods=['POST'])
def fetch_faqs():
    data = request.json
    user_query = data['query']
    
    # Preprocess the user query
    preprocessed_query = preprocess_text(user_query)
    
    # Step 1: Full sentence embedding for context relevance
    user_sentence_embedding = model.encode(preprocessed_query, convert_to_tensor=True)
    sentence_cosine_scores = util.pytorch_cos_sim(user_sentence_embedding, question_embeddings)[0]
    
    # Step 2: Token-level matching with TF-IDF
    query_tfidf = tfidf_vectorizer.transform([preprocessed_query])
    tfidf_cosine_scores = (query_tfidf * faq_tfidf_matrix.T).toarray()[0]  # Compute cosine similarity

    # Step 3: Combine sentence embedding and token-level TF-IDF scores
    combined_scores = {}
    for i in range(len(questions)):
        combined_scores[i] = 0.5 * sentence_cosine_scores[i].item() + 0.5 * tfidf_cosine_scores[i]
    
    # Step 4: Sort FAQs by combined scores in descending order
    sorted_faq_indices = sorted(combined_scores, key=combined_scores.get, reverse=True)

    # Step 5: Apply stricter threshold for relevance
    relevant_faqs = []
    for i in sorted_faq_indices[:5]:  # Limit to top 5 FAQs
        if combined_scores[i] > 0.3:  # Stricter threshold
            relevant_faqs.append({
                'question': questions[i],
                'answer': answers[i],
                'score': combined_scores[i]  # Include score for transparency
            })
    
    return jsonify({'results': relevant_faqs})


if __name__ == '__main__':
    app.run(port=5000)
