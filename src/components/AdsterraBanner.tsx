import { useEffect, useRef } from "react";

type Props = {
  adKey: string;
  width: number;
  height: number;
  className?: string;
};

export function AdsterraBanner({ adKey, width, height, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Clear any prior render (StrictMode / re-mounts)
    container.innerHTML = "";

    const optionsScript = document.createElement("script");
    optionsScript.type = "text/javascript";
    optionsScript.text = `atOptions = { 'key' : '${adKey}', 'format' : 'iframe', 'height' : ${height}, 'width' : ${width}, 'params' : {} };`;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    invokeScript.async = true;

    container.appendChild(optionsScript);
    container.appendChild(invokeScript);

    return () => {
      container.innerHTML = "";
    };
  }, [adKey, width, height]);

  return (
    <div className={`flex w-full justify-center ${className}`}>
      <div
        ref={containerRef}
        style={{ width, height, maxWidth: "100%" }}
        aria-label="Advertisement"
      />
    </div>
  );
}
