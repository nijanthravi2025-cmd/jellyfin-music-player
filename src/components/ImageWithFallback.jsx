import React, { useState } from "react";
import { Music } from "lucide-react";
import { getAssetUrl } from "../utils/tauribridge";

export default function ImageWithFallback({ src, alt, className, fallbackClassName, style, size = 48, ...props }) {
  const [error, setError] = useState(false);

  // Checks if the path is a local file path (not base64 and not remote URL)
  const isLocalFilePath = (path) => {
    if (!path) return false;
    if (path.startsWith("data:") || path.startsWith("http:") || path.startsWith("https:")) {
      return false;
    }
    return true;
  };

  if (error || !src) {
    return (
      <div 
        className={fallbackClassName || className} 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          backgroundColor: "rgba(255,255,255,0.05)", 
          borderRadius: style?.borderRadius || "inherit",
          ...style 
        }}
        {...props}
      >
        <Music size={size} color="#a0a0a0" style={{ flexShrink: 0 }} />
      </div>
    );
  }

  const resolvedSrc = isLocalFilePath(src) ? getAssetUrl(src) : src;

  return (
    <img 
      src={resolvedSrc} 
      alt={alt} 
      className={className} 
      style={{ display: "block", objectFit: "cover", ...style }}
      onError={() => setError(true)}
      {...props} 
    />
  );
}
