"use client"; // 👈 这一行非常重要，声明这是客户端组件

import Script from "next/script";

export default function VConsoleProvider() {
  return (
    <Script
      id="vconsole-script"
      src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js"
      onLoad={() => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.VConsole) {
            new window.VConsole();
        }
      }}
    />
  );
}