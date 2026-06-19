"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: () => void;
      };
    };
  }
}

const INSTAGRAM_EMBED_SCRIPT_ID = "instagram-embed-script";

export function InstagramMarquee({ posts }: Readonly<{ posts: string[] }>) {
  const cleanPosts = posts.filter(Boolean);
  const marqueePosts = [...cleanPosts, ...cleanPosts];

  useEffect(() => {
    if (!cleanPosts.length) {
      return;
    }

    const processEmbeds = () => window.instgrm?.Embeds?.process();
    const existingScript = document.getElementById(INSTAGRAM_EMBED_SCRIPT_ID);

    if (existingScript) {
      processEmbeds();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.id = INSTAGRAM_EMBED_SCRIPT_ID;
    script.src = "https://www.instagram.com/embed.js";
    script.onload = processEmbeds;
    document.body.appendChild(script);
  }, [cleanPosts.length]);

  if (!cleanPosts.length) {
    return null;
  }

  return (
    <div className="mt-5 overflow-hidden">
      <div className="flex w-max animate-[instaMarquee_38s_linear_infinite] gap-4 hover:[animation-play-state:paused]">
        {marqueePosts.map((href, index) => (
          <div
            className="w-[300px] shrink-0 overflow-hidden rounded-sm border border-[#e1d6c4] bg-white p-2 shadow-sm sm:w-[340px]"
            key={`${href}-${index}`}
          >
            <blockquote
              className="instagram-media"
              data-instgrm-captioned
              data-instgrm-permalink={href}
              data-instgrm-version="14"
              style={{
                background: "#fff",
                border: 0,
                margin: 0,
                maxWidth: "100%",
                minWidth: "100%",
                padding: 0,
                width: "100%",
              }}
            >
              <a href={href} rel="noreferrer" target="_blank">
                View this post on Instagram
              </a>
            </blockquote>
          </div>
        ))}
      </div>
    </div>
  );
}
