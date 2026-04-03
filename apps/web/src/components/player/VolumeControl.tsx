import { usePlayerStore } from '../../stores/player.store';
import { Volume2, VolumeX } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';

export const VolumeControl = () => {
  const { volume, setVolume } = usePlayerStore();

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const toggleMute = () => {
    if (volume === 0) setVolume(0.5);
    else setVolume(0);
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-[125px] justify-end">
      <button onClick={toggleMute} className="text-[#a7a7a7] hover:text-white transition-colors h-8 w-8 flex items-center justify-center">
        {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      <Slider.Root
        className="relative flex items-center select-none touch-none w-[93px] h-3 group cursor-pointer"
        value={[volume]}
        max={1}
        step={0.01}
        onValueChange={handleVolumeChange}
      >
        <Slider.Track className="bg-[#4d4d4d] relative grow rounded-full h-1 group-hover:h-[6px] transition-all">
          <Slider.Range className="absolute bg-white group-hover:bg-[#1db954] rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className="hidden group-hover:block w-3 h-3 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)] outline-none" />
      </Slider.Root>
    </div>
  );
};
