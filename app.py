import os
import requests
import time
from flask import Flask, render_template, request, redirect, url_for, jsonify,json


app = Flask(__name__)

REVIEWS_FILE = "reviews.json"

def load_reviews():
    if os.path.exists(REVIEWS_FILE):
        with open(REVIEWS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_reviews(reviews):
    with open(REVIEWS_FILE, 'w') as f:
        json.dump(reviews, f)

reviews=load_reviews()


@app.route('/')
def index():
    return render_template('index.html', reviews=reviews[-5:])

@app.route('/menu')
def menu():
    return render_template('menu.html')

# Spoonacular API configuration
SPOONACULAR_API_KEY = '78ba9b1f184744609c9c71898fc3fe59' 
SPOONACULAR_API_URL = 'https://api.spoonacular.com/recipes/complexSearch'

# In-memory cache: {meal_type: (timestamp, data)}
menu_cache = {}
CACHE_DURATION = 3600  # 1 hour

FALLBACK_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"

@app.route('/api/menu/<meal>')
def get_menu(meal):

    meal_queries = {
        "breakfast": "breakfast recipes",
        "lunch": "Mexican lunch",
        "dinner": "American dinner"
    }
    spoonacular_query = meal_queries.get(meal, "food recipes")

    try:
        current_time = time.time()
        if meal in menu_cache:
            cached_time, data = menu_cache[meal]
            if current_time - cached_time < CACHE_DURATION:
                return jsonify(data)

        params = {
            'query': spoonacular_query,
            'number': 5,
            'apiKey': SPOONACULAR_API_KEY
        }

        response = requests.get(SPOONACULAR_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        results = data.get('results', [])

        menu_items = []
        for item in results:
            name = item.get('title', 'Food')
            image_url = item.get('image', FALLBACK_IMAGE)
            menu_items.append({
                'name': name,
                'image_url': image_url
            })

        # Cache result
        menu_cache[meal] = (current_time, menu_items)
        return jsonify(menu_items)

    except Exception as e:
        print("Error fetching menu:", e)
        return jsonify({"error": "Something went wrong fetching menu data"}), 500


@app.route('/submit-review', methods=['POST'])
def submit_review():
    name = request.form.get('name', 'Anonymous')
    review_text = request.form.get('review', '')

    reviews.append({'user': name.strip(), 'text': review_text.strip()})
    save_reviews(reviews)
    return redirect(url_for('index'))

@app.route('/reviews')
def get_reviews():
    return jsonify(reviews)

if __name__=='__main__':
    app.run(debug=True)
