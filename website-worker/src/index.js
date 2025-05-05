/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request,env) {
	const apiKey = env.SPOONACULAR_API_KEY;
	const url = new URL(request.url)
    const meal = url.pathname.split("/").pop()
    const mealQueries = {
      breakfast: "breakfast recipes",
      lunch: "Mexican lunch",
      dinner: "American dinner"
    }
    const query = mealQueries[meal] || "food recipes"
    const spoonacularKey = apiKey // Add to secrets below

    const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=5&apiKey=${spoonacularKey}`

    try {
      const res = await fetch(apiUrl)
      const data = await res.json()
      const results = data.results || []
      const formatted = results.map(item => ({
        name: item.title || "Food",
        image_url: item.image || "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"
      }))
      return new Response(JSON.stringify(formatted), {
        headers: { "Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
		},
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: "API call failed" }), { status: 500 })
    }
	},
};
