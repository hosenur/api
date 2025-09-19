import { Octokit } from "@octokit/rest";
// interface Env {
//   GITHUB_TOKEN: string;
//   GITHUB_USERNAME: string;
// }

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// If user visits /api, return today's commit count
		if (url.pathname === "/api") {
			try {
				// Init Octokit with token
				const octokit = new Octokit({
					auth: env.GITHUB_TOKEN,
				});

				// Get today's date in UTC YYYY-MM-DD
				const today = new Date().toISOString().split("T")[0];

				// Search commits for this user on today's date
				const response = await octokit.request("GET /search/commits", {
					q: `author:${env.GITHUB_USERNAME} committer-date:${today}`,
					headers: {
						accept: "application/vnd.github.cloak-preview+json",
					},
				});

				return Response.json({
					date: today,
					username: env.GITHUB_USERNAME,
					total_commits: response.data.total_count,
				});
			} catch (err: any) {
				return new Response(
					JSON.stringify({ error: err.message }),
					{ status: 500, headers: { "content-type": "application/json" } }
				);
			}
		}

		// Default route
		return new Response("Hello World!");
	},
} satisfies ExportedHandler<Env>;



