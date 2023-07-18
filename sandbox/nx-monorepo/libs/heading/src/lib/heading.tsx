import { css } from '@nx-monorepo/theme';

/* eslint-disable-next-line */
export interface HeadingProps {}

export function Heading(props: HeadingProps) {
  return (
    <div>
      <h1 className={css({ color: 'heavy' })}>Welcome to Panda! 🐼</h1>
    </div>
  );
}

export default Heading;
