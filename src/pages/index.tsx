import type { NextPage } from 'next';
import Head from 'next/head';

import Scene from '@components/Scene';
import { Canvas } from '@react-three/fiber';
import Toolbar from '@src/components/Toolbar';
import ExportButton from '@src/components/ExportButton';
import ImportButton from '@src/components/ImportButton';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Voxel Landscaping</title>
        <meta name="description" content="DK30 fall 2021" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-full h-screen">
        <Canvas shadows>
          <Scene />
        </Canvas>
        <Toolbar />

        <div className="fixed bottom-0 left-0 m-8 font-mono text-white">
          LMB: Add block
          <br />
          RMB: Remove block
          <br />
          SCROLL: Zoom
        </div>
      </main>
    </>
  );
};

export default Home;
