import { createContextWithHook } from "pastable/react";
import { InterpreterFrom } from "xstate";
import { playgroundMachine } from "./Playground.machine";

export const [PlaygroundMachineProvider, usePlaygroundContext] =
  createContextWithHook<InterpreterFrom<typeof playgroundMachine>>(
    "PlaygroundMachineContext"
  );
