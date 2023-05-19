import { Code } from 'bright'
import { tabs } from './extension'

/** @type {import("bright").Extension} */
const title = {
  name: 'title',
  beforeHighlight: (props, annotations) => {
    if (annotations.length > 0) {
      return { ...props, title: annotations[0].query }
    }
  }
}

// TODO tabs style

/** @see https://bright.codehike.org/recipes/tabs */
export function Tabs({ children }) {
  /* @ts-expect-error Server Component */
  return <Code children={children} extensions={[title, tabs]} />
}
