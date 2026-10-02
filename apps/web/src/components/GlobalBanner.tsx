import { ReactNode } from 'react';

interface GlobalBannerProps {
    children: ReactNode;
    visible: boolean;
}

const GlobalBanner = ({ children, visible }: GlobalBannerProps) => {   
  
  if (!visible) {
    return null;
  }
  
  return (
    <div className='bg-[#e56135] text-center w-full'>
      {children}
    </div>
  );
};

export default GlobalBanner;
