# Token-reference build diagnostics: before/after

Measured on 2026-10-15 using the existing native `sandbox_vite_ts` benchmark. The baseline is the PR base,
`8c179ea85a63db63f2cb3e2e7afb3ba2252e3d99`; the comparison includes the PR and its review fixes, including borrowed
recipe variant sets and filtering pattern props by declared type.

Both executables used Rust 1.93.0 release builds on macOS 26.6.2 arm64. No builds or tests ran concurrently with the
measurements. Other desktop processes were not controlled.

The workload is 220 files / 433,450 source bytes, made by amplifying the real `sandbox/vite-ts/src` corpus with unique
content. File I/O is outside the timers. Config is the benchmark's hand-rolled sandbox-shaped config, not a full loaded
application preset. Both builds produced 149 atoms and 11,456 CSS bytes.

Seven rounds alternated before/after execution order. Each executable warmed up three times and measured 20 iterations
per round. The table reports the median of the seven per-round averages; standard deviations are across those averages.

| Phase                  | Before (ms) | PR (ms) | Change | Stddev before / PR (ms) |
| ---------------------- | ----------: | ------: | -----: | ----------------------: |
| Cold build total       |     12.8073 | 13.9074 | +8.59% |         0.0397 / 0.6342 |
| Cold parse files       |     11.9287 | 13.0346 | +9.27% |         0.0305 / 0.4493 |
| Watch rebuild total    |      0.5231 |  0.5313 | +1.58% |         0.0186 / 0.0159 |
| Watch reparse one file |      0.1469 |  0.1590 | +8.24% |         0.0016 / 0.0063 |

The cold-build increase is measurable: about 1.10 ms for this 220-file workload. The watch-total difference is within
run-to-run variation. These numbers do not establish an overhead bound for other applications, deeply nested styles,
large recipe registries, or files with many missing references. This change adds a build-time string walk; borrowing the
compiled variant sets removes a repeated allocation, not the walk itself.

## Reproduce

Build the benchmark in separate baseline and PR checkouts, using separate Cargo target directories:

```sh
cargo build --release -p pandacss_bench --bin sandbox_vite_ts --locked
./target/release/sandbox_vite_ts --multiplier 20 --unique --warm 3 --iterations 20
```

Run each executable seven times, alternating execution order, without concurrent builds/tests. Keep the corpus and
benchmark source identical between checkouts. Compare `cold.totalMs.perRunMs`, `cold.parseFilesTotal.perRunMs`,
`watch.totalMs.perRunMs`, and `watch.reparseOneFile.perRunMs` from the emitted JSON.

## Samples

Per-round averages, in milliseconds, listed in sample order for each executable:

```json
{
  "cold_total": {
    "before": [12.784144, 12.850598, 12.8073, 12.767798, 12.855619, 12.759571, 12.837171],
    "after": [13.90736, 13.849983, 14.007575, 15.038069, 15.316886, 13.894423, 13.811494]
  },
  "cold_parse": {
    "before": [11.906363, 11.953392, 11.928712, 11.888848, 11.971852, 11.897048, 11.936881],
    "after": [13.006137, 12.968842, 13.088994, 14.103442, 13.654065, 13.034577, 12.920154]
  },
  "watch_total": {
    "before": [0.568417, 0.529652, 0.511444, 0.518873, 0.522273, 0.524071, 0.523081],
    "after": [0.52864, 0.528325, 0.531321, 0.572638, 0.53235, 0.530358, 0.534379]
  },
  "watch_reparse": {
    "before": [0.147783, 0.149946, 0.146154, 0.145321, 0.145535, 0.14746, 0.146908],
    "after": [0.157177, 0.155571, 0.158935, 0.174533, 0.160258, 0.159008, 0.16129]
  }
}
```
