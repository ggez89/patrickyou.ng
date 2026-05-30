/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import AsciiSky from './components/AsciiSky';
import CursorTrail from './components/CursorTrail';

export default function App() {
  return (
    <div id="landing-app-root" className="relative w-full h-screen overflow-hidden bg-[#010204]">
      {/* Dynamic, fully optimized ASCII sky canvas */}
      <AsciiSky />

      {/* Centered signature text overlay, pointer-events-none so it doesn't block mouse movements but stands out beautifully */}
      <div id="branding-container" className="container absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center pointer-events-none w-full px-6 select-none">
        <h1 id="brand-headline" className="signature-title">
          patrickyou.ng
        </h1>
      </div>

      {/* Hardware-accelerated GPU-composited cursor trails */}
      <CursorTrail />
    </div>
  );
}

