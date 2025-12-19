type TwProps = {
  tw: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

const TwDiv = (props: TwProps) => {
  const { tw, children, style, ...rest } = props;
  return <div tw={tw} style={style} {...rest}>{children}</div>;
};


    
const TwImg = (props: TwProps & { src: string; alt?: string }) => {
  const { tw, src, alt, style, ...rest } = props;
  return <img tw={tw} src={src} alt={alt} style={style} {...rest} />;
};

const TwH1 = (props: TwProps) => {
  const { tw, children, style, ...rest } = props;
  return <h1 tw={tw} style={style} {...rest}>{children}</h1>;
};

const TwP = (props: TwProps) => {
  const { tw, children, style, ...rest } = props;
  return <p tw={tw} style={style} {...rest}>{children}</p>;
};

export function HelloOG(props: { title: string; description: string; cloudImage: string; anotherCloudImage: string }) {
  const { title, description, cloudImage, anotherCloudImage } = props;
  return (
    <TwDiv tw="w-full h-full relative p-0" style={{ background: 'linear-gradient(to bottom right, #0284C7 0%, #BAE6FD 100%)' }}>
      {/* PNG Image - Positioned in top-left */}
      <TwImg 
        tw="w-auto h-64 object-contain absolute top-4 left-4 my-20" 
        src={cloudImage}
        alt="Hello World Image"
      />
      
      {/* Another PNG Image - Positioned in top-right */}
      <TwImg 
        tw="w-auto h-64 object-contain absolute top-4 right-4" 
        src={anotherCloudImage}
        alt="Another Cloud Image"
      />
      
      {/* Linear gradient overlay - transparent to sky-200 from bottom */}
      <TwDiv tw="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-sky-200 to-transparent pointer-events-none" />
      
      {/* Hello World Text and Description - Left aligned */}
      <TwDiv tw="absolute left-16 bottom-16 flex flex-col items-start">
        <TwH1 
          tw="text-4xl font-medium text-black max-w-md"
          style={{ fontFamily: 'Instrument Serif', fontWeight: '400' }}
        >
          {title}
        </TwH1>
        
        {/* Dynamic description paragraph */}
        <TwP tw="text-lg text-neutral-800 max-w-3xl mt-2 leading-relaxed"
          style={{ fontFamily: 'Geist Sans', fontWeight: '400' }}
        >
          {description}
        </TwP>
      </TwDiv>
    </TwDiv>
  );
}