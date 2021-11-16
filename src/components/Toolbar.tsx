import { useInterfaceStore } from '@src/utilities/InterfaceStore';
import { Material } from './Cluster';
import classNames from 'classnames';
import Image from 'next/image';
import ExportButton from './ExportButton';
import ImportButton from './ImportButton';

const Toolbar = () => {
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

  return (
    <>
      <div
        className="fixed top-0 left-0 flex flex-col m-4"
        onPointerEnter={() => toggleWorldInteractive(false)}
        onPointerLeave={() => toggleWorldInteractive(true)}
      >
        <div className={rock} onClick={() => setMaterial(Material.ROCK)}>
          <Image className="rounded-lg" src="/rock.png" width="64" height="64" alt="" />
        </div>
        <div className={brick} onClick={() => setMaterial(Material.BRICK)}>
          <Image className="rounded-lg" src="/brick.png" width="64" height="64" alt="" />
        </div>
      </div>
      <div
        className="fixed top-0 right-0 flex m-4"
        onPointerEnter={() => toggleWorldInteractive(false)}
        onPointerLeave={() => toggleWorldInteractive(true)}
      >
        <ExportButton />
        <ImportButton />
      </div>
    </>
  );
};

export default Toolbar;
