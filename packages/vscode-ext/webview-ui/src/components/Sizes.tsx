import { Config } from '../types';
import { remToPixels } from '../utilities/rem-to-pixels';

export type SizesProps = { sizes: Config['sizes'] };

export function Sizes(props: SizesProps) {
  const { sizes: sizesProp } = props;
  const sizes = Object.entries(sizesProp);

  console.log('sizes :>> ', sizes);

  const renderPixels = (size: string) => {
    if (size.endsWith('px')) return size;
    else return remToPixels(size);
  };

  return (
    <div className="token-group sizes-tokens">
      <div className="token-content ">
        <span>Name</span>
        <span>Size</span>
        <span style={{ gridColumn: 'span 3 / span 3' }}>Pixels</span>
        <hr />
        {sizes.map(([name, size]) => (
          <>
            <span>{name}</span>
            <span>{size}</span>
            <span>{renderPixels(size)}</span>
            <span className="size-box" style={{ width: size }} />
            <hr />
          </>
        ))}
      </div>
    </div>
  );
}
