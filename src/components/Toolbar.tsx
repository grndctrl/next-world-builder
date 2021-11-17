import { useInterfaceStore } from '@src/utilities/InterfaceStore';
import { Material } from './Cluster';
import classNames from 'classnames';
import Image from 'next/image';
import ExportButton from './ExportButton';
import ImportButton from './ImportButton';
import { useEffect, useRef } from 'react';

const Toolbar = () => {
  const audioHover = useRef<HTMLAudioElement | null>(null);
  const audioConfirm = useRef<HTMLAudioElement | null>(null);
  const { currentMaterial, setMaterial, toggleWorldInteractive } = useInterfaceStore();

  const rock = classNames(
    'm-2',
    'text-gray-800',
    'bg-white border-4',
    'rounded-lg',
    { 'border-current': currentMaterial === Material.ROCK },
    { 'border-white': currentMaterial !== Material.ROCK }
  );

  const brick = classNames(
    'm-2',
    'text-gray-800',
    'bg-white border-4',
    'rounded-lg',
    { 'border-current': currentMaterial === Material.BRICK },
    { 'border-white': currentMaterial !== Material.BRICK }
  );

  const handlePointerEnter = () => {
    if (audioHover.current) {
      audioHover.current.pause();
      audioHover.current.currentTime = 0;
      audioHover.current.play();
    }
    toggleWorldInteractive(false);
  };

  const handlePointerLeave = () => {
    toggleWorldInteractive(true);
  };

  const handleClick = (material: Material) => {
    if (audioConfirm.current) {
      audioConfirm.current.pause();
      audioConfirm.current.currentTime = 0;
      audioConfirm.current.play();
    }
    setMaterial(material);
  };

  useEffect(() => {
    if (audioHover.current) {
      audioHover.current.volume = 0.2;
    }

    if (audioConfirm.current) {
      audioConfirm.current.volume = 0.5;
    }
  }, []);

  return (
    <>
      <audio ref={audioHover}>
        <source src="/hover.mp3" />
      </audio>
      <audio ref={audioConfirm}>
        <source src="/confirm.mp3" />
      </audio>
      <div className="fixed top-0 left-0 flex flex-col m-4">
        <div
          className={rock}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onClick={() => handleClick(Material.ROCK)}
        >
          <Image className="rounded-lg" src="/rock.png" width="64" height="64" alt="" />
        </div>
        <div
          className={brick}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onClick={() => handleClick(Material.BRICK)}
        >
          <Image className="rounded-lg" src="/brick.png" width="64" height="64" alt="" />
        </div>
      </div>
      <div className="fixed top-0 right-0 flex flex-col m-4">
        <ExportButton onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave} />
        <ImportButton onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave} />
      </div>
    </>
  );
};

export default Toolbar;
