export default function GridShape() {
  return (
    <>
      {/* Top Right Grid */}
      <div className="absolute right-0 top-0 w-full max-w-[200px] xl:max-w-[300px] opacity-30">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-white/20" />
        </svg>
      </div>
      
      {/* Bottom Left Grid */}
      <div className="absolute bottom-0 left-0 w-full max-w-[200px] xl:max-w-[300px] opacity-30 rotate-180">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid2)" className="text-white/20" />
        </svg>
      </div>
      
      {/* Center Dots Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <defs>
            <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="currentColor" className="text-white"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
    </>
  );
}
