import { SplashCursor } from "@/components/ui/splash-cursor"

export function SplashDemo() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* SplashCursor creates fluid cursor effects */}
      <SplashCursor 
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1440}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        PRESSURE_ITERATIONS={20}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        SHADING={true}
        COLOR_UPDATE_SPEED={10}
        BACK_COLOR={{ r: 0.5, g: 0, b: 0 }}
        TRANSPARENT={true}
      />
      
      {/* Content overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Fluid Cursor Demo
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Move your cursor around to see the fluid simulation in action
          </p>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">Features</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Real-time fluid simulation</li>
                <li>• WebGL-powered effects</li>
                <li>• Interactive cursor tracking</li>
                <li>• Customizable parameters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




