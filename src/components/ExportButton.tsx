import { useBlockStore } from '@src/utilities/BlockStore';

const ExportButton = () => {
  const { exportClusters } = useBlockStore();

  const handleClick = () => {
    console.log('Export button clicked');
    downloadFile();
  };

  const downloadFile = async () => {
    const json = exportClusters();
    const blob = new Blob([json], { type: 'application/json' });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'clusters.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleClick}
      className="w-10 h-10 p-2 m-2 text-gray-800 bg-white rounded-lg hover:text-white hover:bg-gray-800"
    >
      <svg className="w-full h-auto" fill="none" viewBox="0 0 24 24">
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
          d="M12 14.25L12 5"
        ></path>
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M8.75 8.25L12 4.75L15.25 8.25"
        ></path>
      </svg>
    </button>
  );
};

export default ExportButton;
