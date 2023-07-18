import { render } from '@testing-library/react';

import Heading from './heading';

describe('Heading', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Heading />);
    expect(baseElement).toBeTruthy();
  });
});
