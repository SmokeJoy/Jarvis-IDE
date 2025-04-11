import type { ChatCompletionMessageParam } from "openai";
import { ChatCompletionContentPartText, ChatCompletionContentPartImage } from "../../types/global.js";

export async function fetchOpenGraphData(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
}> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    const getMetaContent = (property: string): string | undefined => {
      const match = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`));
      return match?.[1];
    };

    return {
      title: getMetaContent("og:title"),
      description: getMetaContent("og:description"),
      image: getMetaContent("og:image"),
    };
  } catch (error) {
    console.error("Error fetching Open Graph data:", error);
    return {};
  }
}

export function formatImageUrl(url: string): ChatCompletionContentPartImage {
  return {
    type: "image",
    source: {
      type: "url",
      url,
    },
  };
}

export function formatLinkPreview(url: string, ogData: { title?: string; description?: string; image?: string }): ChatCompletionMessageParam {
  const parts: (ChatCompletionContentPartText | ChatCompletionContentPartImage)[] = [];

  // Add title and description
  const textParts = [];
  if (ogData.title) {
    textParts.push(`# ${ogData.title}`);
  }
  if (ogData.description) {
    textParts.push(ogData.description);
  }
  textParts.push(`Source: ${url}`);

  parts.push({
    type: "text",
    text: textParts.join("\n\n"),
  });

  // Add image if available
  if (ogData.image) {
    parts.push(formatImageUrl(ogData.image));
  }

  return {
    role: "assistant",
    content: parts,
  };
} 