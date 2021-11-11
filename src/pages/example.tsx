import type { NextPage } from 'next';
import Head from 'next/head';

import BSPExample from '@src/components/Brick/BSPExample';
import { Canvas } from '@react-three/fiber';
import Scene from '@src/components/Scene';

const Example: NextPage = () => {
  return (
    <>
      <Head>
        <title>Example</title>
        <meta name="description" content="DK30 fall 2021" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-full h-screen">
        <Canvas>
          <Scene />
        </Canvas>
      </main>
    </>
  );
};

export default Example;
