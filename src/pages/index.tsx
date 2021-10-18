import type { NextPage } from 'next';
import Head from 'next/head';

import Scene from '@components/Scene';
import { Canvas } from '@react-three/fiber';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-full h-screen">
        <Canvas shadows>
          <Scene />
        </Canvas>
      </main>
    </>
  );
};

export default Home;