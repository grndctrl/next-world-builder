import { throttle } from 'lodash';
import { useEffect } from 'react';

import { useThree } from '@react-three/fiber';
import { interfaceStore, useInterfaceStore } from '@utilities/InterfaceStore';

const Pointer = () => {
  const { setPointerDownStart, togglePointerDown, togglePointerDragging } = useInterfaceStore();
  const { mouse } = useThree();

  useEffect(() => {
    window.addEventListener('mousemove', throttle(handleMouseMove, 100));
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
  }, []);

  const handleMouseMove = ({ clientX, clientY }: MouseEvent) => {
    const { isPointerDown, pointerDownStart } = interfaceStore.getState();

    if (isPointerDown && mouse.distanceTo(pointerDownStart) > 0.025) {
      togglePointerDragging(true);
    }
  };

  const handlePointerDown = ({ clientX, clientY }: MouseEvent) => {
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;

    setPointerDownStart(x, y);
    togglePointerDown(true);
  };
  const handlePointerUp = () => {
    togglePointerDown(false);
    setTimeout(() => {
      togglePointerDragging(false);
    }, 10);
  };

  return null;
};

export default Pointer;
