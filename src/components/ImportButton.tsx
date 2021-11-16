import { useBlockStore } from '@src/utilities/BlockStore';

const ImportButton = () => {
  const { importClusters } = useBlockStore();

  const handleClick = () => {
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

  return (
    <button
      onClick={handleClick}
      className="w-10 h-10 p-2 m-2 text-gray-800 bg-white rounded-lg hover:text-white hover:bg-gray-800"
    >
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
