/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
// console.log("KV keys:", list.keys); // ✅ Move this up

//     const keys = list.keys
//         .filter(k => k.metadata && k.metadata.timestamp)

async function getRecentReviews(env) {
    const list = await env.REVIEWS.list();
    const keys = list.keys
        .sort((a, b) => b.name.localeCompare(a.name)) // Sort by timestamp in key name
        .slice(-5); // Get last 5

    const reviews = [];
    for (const key of keys.reverse()) {
        const review = await env.REVIEWS.get(key.name, { type: "json" });
        if (review) reviews.push(review);
    }
    return reviews;
}

async function addReview(env, data) {
    const timestamp = Date.now();
    const id = `review-${timestamp}`;
    const review = {
        user: data.name || "Anonymous",
        text: data.review || "",
        timestamp
    };
    await env.REVIEWS.put(id, JSON.stringify(review));
}

function withCors(response) {
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	response.headers.set("Access-Control-Allow-Headers", "Content-Type");
	return response;
  }
export default{
async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

      if (pathname.startsWith("/api/menu/") && method === "GET") {
      const meal = pathname.split("/").pop();
      const mealQueries = {
        breakfast: "breakfast recipes",
        lunch: "Mexican lunch",
        dinner: "American dinner"
      };
      const query = mealQueries[meal] || "food recipes";
      const spoonacularKey = env.SPOONACULAR_API_KEY;
      const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=5&apiKey=${spoonacularKey}`;

      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        const results = data.results || [];
        const formatted = results.map(item => ({
          name: item.title || "Food",
          image_url: item.image || "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"
        }));
        return new Response(JSON.stringify(formatted), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "API call failed" }), { status: 500 });
      }
    }

    
    if (pathname === "/reviews" && method === "GET") {
		const reviews = await getRecentReviews(env);
		const res = new Response(JSON.stringify(reviews), {
		  headers: { "Content-Type": "application/json" }
		});
		return withCors(res);
    }

   
    if (pathname === "/submit-review" && method === "POST") {
		const formData = await request.formData();
		const name = formData.get("name") || "Anonymous";
		const review = formData.get("review") || "";
		await addReview(env, { name, review });
		return withCors(new Response("Review submitted", { status: 200 }));
    }

	return withCors(new Response("Not found", { status: 404 }));
  }
};




  
  



// export default {
// 	async fetch(request,env) {
// 	const apiKey = env.SPOONACULAR_API_KEY;
// 	const url = new URL(request.url)
//     const meal = url.pathname.split("/").pop()
//     const mealQueries = {
//       breakfast: "breakfast recipes",
//       lunch: "Mexican lunch",
//       dinner: "American dinner"
//     }
//     const query = mealQueries[meal] || "food recipes"
//     const spoonacularKey = apiKey // Add to secrets below

//     const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=5&apiKey=${spoonacularKey}`

//     try {
//       const res = await fetch(apiUrl)
//       const data = await res.json()
//       const results = data.results || []
//       const formatted = results.map(item => ({
//         name: item.title || "Food",
//         image_url: item.image || "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"
//       }))
//       return new Response(JSON.stringify(formatted), {
//         headers: { "Content-Type": "application/json",
// 		"Access-Control-Allow-Origin": "*",
// 		},
//       })
//     } catch (err) {
//       return new Response(JSON.stringify({ error: "API call failed" }), { status: 500 })
//     }
// 	},
// };
