const PromoBanner = () => {   
  return (
    <div className='flex flex-col md:flex-row justify-between w-4/5 mr-auto ml-auto mb-7'>
      <div className='w-full md:w-[50%] mr-8'>
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Team Chess
            </span>
            <br />
              Reimagined
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            The first platform transforming chess into a collaborative adventure. 
            Play 2v2 chess with friends, where strategy meets teamwork.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
