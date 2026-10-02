import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';
import { Chessboard } from 'react-chessboard';
import { Button } from '@/components/ui/button';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>{"404 - Page Not Found | Relay Chess"}</title>
      </Head>
      <div className='flex flex-col justify-center content-center'>
        <div className='z-10 m-auto text-4xl bold justify-center text-white mb-10 mt-10'>{"404 - Page Not Found"}</div>
        <div className='m-auto'>
          <Link href={'/'}>
            <Button className='text-white text-2xl mt-5'>
              {"Go Home"}
            </Button>
          </Link>
        </div>
        <div className='flex place-content-evenly items-center mt-5'>
          <div className='h-[300px] w-[300px]'>
            <Chessboard
              position={'kkkkkkkk/kkkkkkkk/8/8/8/8/KKKKKKKK/KKKKKKKK'}
              isDraggablePiece={() => true}
              onPieceClick={() => false}
            />
          </div>
          <Image src='/media/huh.png' alt={"404"} width={500} height={300} />
        </div>
      </div>
    </>
  );
}
