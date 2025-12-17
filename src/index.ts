import { Octokit } from '@octokit/rest';
import { container, image, percentage, rem, text } from '@takumi-rs/helpers';
import { initSync, Renderer } from '@takumi-rs/wasm';
import module from '@takumi-rs/wasm/takumi_wasm_bg.wasm';
// @ts-ignore
import medium from '../fonts/jakarta.ttf';
// @ts-ignore
import departureMono from '../fonts/DepartureMono-Regular.otf';
// @ts-ignore
import paperMono from '../fonts/PaperMono-Regular.otf';
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

// Renderer with Departure Mono font for openportal.space title
const departureRenderer = new Renderer();
departureRenderer.loadFont(new Uint8Array(departureMono));

// Renderer with both fonts for openportal.space (Departure Mono + Paper Mono)
const openportalRenderer = new Renderer();
openportalRenderer.loadFont(new Uint8Array(departureMono));
openportalRenderer.loadFont(new Uint8Array(paperMono));

let logo: string;

// Minimal WakaTime response type
interface WakaTimeSummary {
	data: {
		grand_total: {
			text: string;
		};
	}[];
}

// Helper function to create CORS headers - now allows all origins
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

			// --- OG image for openportal.space ---
			if (url.pathname === '/openportal/og') {
				const title = (url.searchParams.get('title') || 'Open Portal').toUpperCase();
				const description = url.searchParams.get('description') || '';

				// Render with openportalRenderer (has both Departure Mono + Paper Mono)
				const webp = openportalRenderer.render(
					container({
						style: {
							width: percentage(100),
							height: percentage(100),
							backgroundColor: '#ffffff',
							padding: rem(4),
							flexDirection: 'column',
							justifyContent: 'center',
							gap: rem(1.5),
						},
						children: [
							text(title, {
								fontSize: 72,
								color: '#0a0a0a',
							}),
							...(description
								? [
										text(description, {
											fontSize: 32,
											color: '#52525b',
										}),
									]
								: []),
						],
					}),
					1200,
					630,
					'webp'
				);

				return new Response(webp, {
					headers: {
						'Content-Type': 'image/webp',
						'Cache-Control': 'public, max-age=31536000',
						...corsHeaders,
					},
				});
			}

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
			const todayUTC = new Date().toISOString().split('T')[0];
			const formatter = new Intl.DateTimeFormat('en-CA', {
				timeZone: 'Asia/Kolkata',
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			});
			const todayIST = formatter.format(new Date());

			const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
			const ghResponse = await octokit.request('GET /search/commits', {
				q: `author:${env.GITHUB_USERNAME} committer-date:${todayUTC}`,
				headers: { accept: 'application/vnd.github.cloak-preview+json' },
			});
			const totalCommits = ghResponse.data.total_count;

			const wakaResp = await fetch(`https://wakatime.com/api/v1/users/current/summaries?start=${todayIST}&end=${todayIST}`, {
				headers: {
					Authorization: 'Basic ' + btoa(env.WAKATIME_API_KEY + ':'),
				},
			});

			if (!wakaResp.ok) throw new Error(`WakaTime API error: ${wakaResp.status}`);

			const wakaData: WakaTimeSummary = await wakaResp.json();
			const timeCodedToday = wakaData.data?.[0]?.grand_total?.text || '0 mins';

			return Response.json({
				date_github: todayUTC,
				date_wakatime: todayIST,
				username: env.GITHUB_USERNAME,
				total_commits: totalCommits,
				time_coded: timeCodedToday,
			}, {
				headers: corsHeaders,
			});

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