import { ImageResponse } from "@takumi-rs/image-response";
import { HelloOG } from "../og/hello-og";

export const ogHandler = async (request: Request) => {
  try {
    // Parse URL to get query parameters
    const url = new URL(request.url);
    const title = url.searchParams.get('title') || 'hosenur.dev';
    const description = url.searchParams.get('description') || 'Lorem ipsum dolor sit amet, consectetur adipis do eiusmodcing elit. Sed tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';
    
    // Use createElement to avoid JSX syntax in .ts file
    const { createElement } = await import('react');
    return new ImageResponse(createElement(HelloOG, { title, description }), {
      width: 1200,
      height: 630,
      format: "webp",
    });
  } catch (error) {
    console.error('OG image generation failed:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
};
