import { Octokit } from "@octokit/rest";

interface Env {
  GITHUB_TOKEN: string;
  GITHUB_USERNAME: string;
  WAKATIME_API_KEY: string;
}

// Minimal WakaTime response type
interface WakaTimeSummary {
  data: {
    grand_total: {
      text: string;
    };
  }[];
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      // --- Today's date in UTC (for GitHub) ---
      const todayUTC = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // --- Today's date in Asia/Kolkata (for WakaTime) ---
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const todayIST = formatter.format(new Date()); // YYYY-MM-DD

      // --- GitHub commits today (UTC) ---
      const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

      const ghResponse = await octokit.request("GET /search/commits", {
        q: `author:${env.GITHUB_USERNAME} committer-date:${todayUTC}`,
        headers: { accept: "application/vnd.github.cloak-preview+json" },
      });

      const totalCommits = ghResponse.data.total_count;

      // --- WakaTime coding time today (IST) ---
      const wakaResp = await fetch(
        `https://wakatime.com/api/v1/users/current/summaries?start=${todayIST}&end=${todayIST}`,
        {
          headers: {
            Authorization: "Basic " + btoa(env.WAKATIME_API_KEY + ":"),
          },
        }
      );

      if (!wakaResp.ok) {
        throw new Error(`WakaTime API error: ${wakaResp.status}`);
      }

      const wakaData: WakaTimeSummary = await wakaResp.json();
      const timeCodedToday =
        wakaData.data?.[0]?.grand_total?.text || "0 mins";

      // --- Final JSON response ---
      return Response.json({
        date_github: todayUTC,
        date_wakatime: todayIST,
        username: env.GITHUB_USERNAME,
        total_commits: totalCommits,
        time_coded: timeCodedToday,
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }
  },
} satisfies ExportedHandler<Env>;
