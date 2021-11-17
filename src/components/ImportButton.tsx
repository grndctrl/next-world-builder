import { useBlockStore } from '@src/utilities/BlockStore';
import { useInterfaceStore } from '@src/utilities/InterfaceStore';
import { useEffect, useRef, useState } from 'react';

const ImportButton = (props: any) => {
  const audioConfirm = useRef<HTMLAudioElement | null>(null);
  const audioHover = useRef<HTMLAudioElement | null>(null);
  const [isHover, toggleHover] = useState<boolean>(false);
  const { toggleWorldInteractive } = useInterfaceStore();
  const { importClusters } = useBlockStore();

  const handleClick = () => {
    if (audioConfirm.current) {
      audioConfirm.current.play();
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.click();
    input.onchange = () => {
      if (input.files) {
        if (input.files.length > 0) {
          const file = input.files[0];
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              importClusters(reader.result as string);
            }
          };
          reader.readAsText(file);
        }
      }
    };
  };

  const handlePointerEnter = () => {
    if (audioHover.current) {
      audioHover.current.play();
    }
    toggleWorldInteractive(false);
    toggleHover(true);
  };

  const handlePointerLeave = () => {
    toggleWorldInteractive(true);
    toggleHover(false);
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
    <button
      {...props}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className="relative w-10 h-10 p-2 m-2 text-gray-800 bg-white rounded-lg hover:text-white hover:bg-gray-800"
    >
      <audio ref={audioConfirm}>
        <source src="/confirm.mp3" />
      </audio>
      <audio ref={audioHover}>
        <source src="/hover.mp3" />
      </audio>
      {isHover && (
        <div className="absolute top-0 bottom-0 right-0 flex items-center mr-10">
          <div className="px-2 py-1 mr-2 text-xs text-white bg-gray-800 rounded-full">IMPORT</div>
        </div>
      )}
      <svg className="w-full h-auto stroke-current" fill="none" viewBox="0 0 24 24">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M4.75 14.75V16.25C4.75 17.9069 6.09315 19.25 7.75 19.25H16.25C17.9069 19.25 19.25 17.9069 19.25 16.25V14.75"
        ></path>
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M12 14.25L12 4.75"
        ></path>
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M8.75 10.75L12 14.25L15.25 10.75"
        ></path>
      </svg>
    </button>
  );
};

export default ImportButton;
