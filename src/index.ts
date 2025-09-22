import { Octokit } from '@octokit/rest';
import { container, image, percentage, rem, text } from '@takumi-rs/helpers';
import { initSync, Renderer } from '@takumi-rs/wasm';
import module from '@takumi-rs/wasm/takumi_wasm_bg.wasm';
// @ts-ignore
import medium from '../fonts/jakarta.ttf';
import { fetchLogo } from './utils';

interface Env {
	GITHUB_TOKEN: string;
	GITHUB_USERNAME: string;
	WAKATIME_API_KEY: string;
}

// --- Init Takumi once ---
initSync({ module });
const renderer = new Renderer();
renderer.loadFont(new Uint8Array(medium));
let logo: string;

// Minimal WakaTime response type
interface WakaTimeSummary {
	data: {
		grand_total: {
			text: string;
		};
	}[];
}

// Helper function to create CORS headers
function getCorsHeaders(): HeadersInit {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400',
	};
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const corsHeaders = getCorsHeaders();

		// Handle preflight OPTIONS request
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		try {
			const url = new URL(request.url);

			// --- OG image path ---
			if (url.pathname === '/og') {
				logo ??= await fetchLogo();
				const name = url.searchParams.get('name') || 'Wizard';

				const webp = renderer.render(
					container({
						style: {
							width: percentage(100),
							height: percentage(100),
							backgroundColor: 'white',
							padding: rem(4),
							flexDirection: 'column',
							gap: rem(0.5),
						},
						children: [
							text(`Hello, ${name}!`, { fontSize: 64 }),
							text('Nothing beats a Jet2 holiday!', { fontSize: 32 }),
							text(request.url, { fontSize: 32 }),
							image({
								src: logo,
								width: 96,
								height: 96,
								style: {
									position: 'absolute',
									inset: ['auto', 'auto', rem(4), rem(4)],
									borderRadius: percentage(50),
								},
							}),
						],
					}),
					1200,
					630,
					'webp'
				);

				return new Response(webp, {
					headers: {
						'Content-Type': 'image/webp',
						'Cache-Control': 'private, max-age=0, no-cache, no-store, must-revalidate',
						...corsHeaders,
					},
				});
			}

			// --- JSON stats path (default /) ---

			// GitHub → use UTC start/end range
			const startUTC = new Date();
			startUTC.setUTCHours(0, 0, 0, 0);
			const endUTC = new Date();
			endUTC.setUTCHours(23, 59, 59, 999);

			const startISO = startUTC.toISOString();
			const endISO = endUTC.toISOString();

			const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
			const ghResponse = await octokit.request('GET /search/commits', {
				q: `author:${env.GITHUB_USERNAME} committer-date:${startISO}..${endISO}`,
				headers: { accept: 'application/vnd.github.cloak-preview+json' },
			});
			const totalCommits = ghResponse.data.total_count;

			// WakaTime → use IST (Asia/Kolkata) date
			const formatter = new Intl.DateTimeFormat('en-CA', {
				timeZone: 'Asia/Kolkata',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			});
			const todayIST = formatter.format(new Date());

			const wakaResp = await fetch(
				`https://wakatime.com/api/v1/users/current/summaries?start=${todayIST}&end=${todayIST}`,
				{
					headers: {
						Authorization: 'Basic ' + btoa(env.WAKATIME_API_KEY + ':'),
					},
				}
			);

			if (!wakaResp.ok) throw new Error(`WakaTime API error: ${wakaResp.status}`);

			const wakaData: WakaTimeSummary = await wakaResp.json();
			const timeCodedToday = wakaData.data?.[0]?.grand_total?.text || '0 mins';

			return Response.json(
				{
					date_github_start: startISO,
					date_github_end: endISO,
					date_wakatime: todayIST,
					username: env.GITHUB_USERNAME,
					total_commits: totalCommits,
					time_coded: timeCodedToday,
				},
				{
					headers: corsHeaders,
				}
			);
		} catch (err: any) {
			return new Response(JSON.stringify({ error: err.message }), {
				status: 500,
				headers: {
					'content-type': 'application/json',
					...corsHeaders,
				},
			});
		}
	},
} satisfies ExportedHandler<Env>;
