import { useInterpret } from "@xstate/react";
import { Playground } from "./Playground";
import { playgroundMachine } from "./Playground.machine";
import { PlaygroundMachineProvider } from "./PlaygroundMachineProvider";

export const PlaygroundWithMachine = () => {
  const service = useInterpret(playgroundMachine);

  return (
    <PlaygroundMachineProvider value={service}>
      <Playground />
    </PlaygroundMachineProvider>
  );
};

export default PlaygroundWithMachine;
