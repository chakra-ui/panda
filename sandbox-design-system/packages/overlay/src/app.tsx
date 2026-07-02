import { Badge, Button } from '@sandbox/ds'
// chip comes from the design system (re-exported); panel is the app's own delta;
// tag is redefined by the app (conflict — the app's version wins).
import { chip, panel, tag } from '../styled-system/recipes'

export function App() {
  return (
    <main className={panel()}>
      <h1>Overlay demo</h1>
      <Button>Welcome</Button>
      <Badge>Stable</Badge>
      <span className={chip()}>From the design system</span>
      <span className={tag()}>Overridden by the app</span>
    </main>
  )
}
