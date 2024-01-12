import {
  Fragment,
  Profiler as ReactProfiler,
  useState,
  useCallback,
} from "react";

function ProfilerResult(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) {
  this.id = id;
  this.phase = phase;
  this.actualDuration = actualDuration;
  this.baseDuration = baseDuration;
  this.startTime = startTime;
  this.commitTime = commitTime;
}

const entries = [];

const profilerResults = function (...args) {
  entries.push(new ProfilerResult(...args));
  console.group("Profiler");
  console.table(entries);
  console.groupEnd();
};

export const Profiler = ({ children, id, name, onRerender }) => {
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
