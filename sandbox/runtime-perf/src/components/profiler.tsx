import {
  Fragment,
  Profiler as ReactProfiler,
  useState,
  useCallback,
  type ReactNode,
  type ProfilerOnRenderCallback,
} from "react";

type ProfilerResult = {
  id: string;
  phase: string;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
};

const entries: ProfilerResult[] = [];

const profilerResults: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  entries.push({
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  });
  console.group("Profiler");
  console.table(entries);
  console.groupEnd();
};

type ProfilerProps = {
  children: ReactNode;
  id: string;
  name?: string;
  onRerender: (value: number) => void;
};

export const Profiler = ({ children, id, onRerender }: ProfilerProps) => {
  const [value, setValue] = useState(0);

  const onClick = useCallback(() => {
    setValue((value) => value + 1);
    onRerender(value);
  }, [value]);

  return (
    <Fragment>
      <h1>Panda</h1>
      <button onClick={onClick}>Force Rerender</button>
      <hr style={{ margin: "24px 0" }} />
      <ReactProfiler onRender={profilerResults} id={id}>
        {children}
      </ReactProfiler>
    </Fragment>
  );
};
