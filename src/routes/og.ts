import { Renderer } from "@takumi-rs/core";
import { fromJsx } from "@takumi-rs/helpers/jsx";
import { HelloOG } from "../og/hello-og";
import { cloudPath, anotherCloudPath, instrumentSerifPath, geistSansPath } from "../assets";
import type { Context } from "elysia";
import { createElement } from 'react';

// Load fonts
const [instrumentSerifData, geistSansData] = await Promise.all([
  Bun.file(instrumentSerifPath).arrayBuffer(),
  Bun.file(geistSansPath).arrayBuffer(),
]);

// Instantiate renderer once with fonts
const renderer = new Renderer({
  fonts: [
    {
      name: 'Instrument Serif',
      data: instrumentSerifData,
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Geist Sans',
      data: geistSansData,
      weight: 400,
      style: 'normal',
    },
  ],
});

export const ogHandler = async ({ query }: Context) => {
  try {
    const title = query.title || 'hosenur.dev';
    const description = query.description || 'Lorem ipsum dolor sit amet, consectetur adipis do eiusmodcing elit. Sed tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';
    
    // Load images
    const [cloudBuffer, anotherCloudBuffer] = await Promise.all([
      Bun.file(cloudPath).arrayBuffer(),
      Bun.file(anotherCloudPath).arrayBuffer(),
    ]);

    const cloudImage = `data:image/png;base64,${Buffer.from(cloudBuffer).toString('base64')}`;
    const anotherCloudImage = `data:image/png;base64,${Buffer.from(anotherCloudBuffer).toString('base64')}`;

    // Create element with image data props
    const element = createElement(HelloOG, { 
      title, 
      description,
      cloudImage,
      anotherCloudImage
    });

    // Convert JSX to internal format
    const jsx = await fromJsx(element);

    // Render image
    const buffer = await renderer.render(jsx, {
      width: 1200,
      height: 630,
      format: "webp",
    });

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "content-type": "image/webp",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error('OG image generation failed:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
};
