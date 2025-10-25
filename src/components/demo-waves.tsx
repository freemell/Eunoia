import Waves from "@/components/ui/waves-background"

function WavesDemo() {
  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 overflow-hidden">
      {/* Waves background */}
      <Waves
        lineColor="rgba(255, 255, 255, 0.2)"
        backgroundColor="transparent"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        xGap={12}
        yGap={36}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Interactive Waves
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Move your mouse to interact with the waves
          </p>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">Features</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Real-time wave simulation</li>
                <li>• Mouse interaction effects</li>
                <li>• Perlin noise generation</li>
                <li>• Customizable parameters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { WavesDemo }




