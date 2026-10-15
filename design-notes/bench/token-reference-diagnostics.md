# Token-reference build diagnostics: build cost

Measured on 2026-10-15 using the existing native `sandbox_vite_ts` benchmark. Three executables compare:

- Base: `8c179ea85a63db63f2cb3e2e7afb3ba2252e3d99`, before this PR.
- Previous PR: `cc930bdd37bdc7e8c8e40b170345d96e81ca86bb`, with owned style-path strings.
- Optimized PR: borrowed object keys, numeric array indexes, inline path storage, and a marker check before scanning.

All executables used Rust 1.93.0 release builds on macOS 26.6.2 arm64. No builds or tests ran concurrently with the
measurements. Other desktop processes were not controlled.

The workload is 220 files / 433,450 source bytes, made by amplifying the real `sandbox/vite-ts/src` corpus with unique
content. File I/O is outside the timers. Config is the benchmark's hand-rolled sandbox-shaped config, not a full loaded
application preset. All builds produced 149 atoms and 11,456 CSS bytes. The stylesheet snapshot suite also passed.

Seven rounds rotated execution order across the three executables. Each executable warmed up three times and measured
20 iterations per round. The table reports the median of the seven per-round averages.

| Phase | Base (ms) | Previous PR (ms) | Optimized PR (ms) | vs base | vs previous PR |
| --- | ---: | ---: | ---: | ---: | ---: |
| Cold build total | 12.9289 | 13.8262 | 13.2942 | +2.83% | -3.85% |
| Cold parse files | 12.0358 | 12.9515 | 12.4209 | +3.20% | -4.10% |
| Watch rebuild total | 0.5181 | 0.5308 | 0.5259 | +1.49% | -0.93% |
| Watch reparse one file | 0.1484 | 0.1585 | 0.1535 | +3.44% | -3.18% |

Cold builds improved by about 0.53 ms compared with the previous implementation. Remaining overhead versus the base is
about 0.37 ms (2.83%). The earlier two-way measurement reported 8.59% overhead; the three-way run measured 6.94% for
the same previous PR binary. This variability is why all three executables were measured together again.

Borrowing paths removes per-key string allocation; indexes remain numbers until inspection needs source locations.
Strings without `{` or `token(` skip the reference scanner. The build still walks style values to produce warnings.
This run measures the combined optimization and does not isolate the contribution of each change.

There were cold-build outliers in the base and optimized samples. Watch-total differences are small relative to
run-to-run variation. These results do not establish an overhead bound for other applications, deeply nested styles,
large recipe registries, or files containing many missing references.

Standard deviations across per-round averages, in milliseconds:

| Phase | Base | Previous PR | Optimized PR |
| --- | ---: | ---: | ---: |
| Cold build total | 1.2391 | 0.0813 | 1.3417 |
| Cold parse files | 1.2352 | 0.0768 | 0.3311 |
| Watch rebuild total | 0.0069 | 0.0106 | 0.0093 |
| Watch reparse one file | 0.0041 | 0.0037 | 0.0023 |

## Reproduce

Build the benchmark in separate checkouts using separate Cargo target directories, preserving each executable:

```sh
cargo build --release -p pandacss_bench --bin sandbox_vite_ts --locked
./target/release/sandbox_vite_ts --multiplier 20 --unique --warm 3 --iterations 20
```

Run each executable seven times, rotating execution order, without concurrent builds/tests. Keep the corpus and
benchmark source identical between checkouts. Compare `cold.totalMs.perRunMs`, `cold.parseFilesTotal.perRunMs`,
`watch.totalMs.perRunMs`, and `watch.reparseOneFile.perRunMs` from the emitted JSON.

## Samples

Per-round averages, in milliseconds, listed in sample order for each executable. `before` is the base, `after` is the
previous PR, and `optimized` is the borrowed-path implementation:

```json
{
  "cold_total": {
    "before": [
      12.874442,
      13.236654,
      12.940471,
      12.793046,
      12.928885,
      16.200965,
      12.887465
    ],
    "after": [
      13.8262,
      13.728435,
      13.850596,
      13.992235,
      13.802579,
      13.860362,
      13.79544
    ],
    "optimized": [
      13.233817,
      13.531846,
      16.856581,
      13.2037,
      13.294219,
      13.441158,
      13.224777
    ]
  },
  "cold_parse": {
    "before": [
      11.995056,
      12.308356,
      12.035785,
      11.917229,
      12.046242,
      15.305733,
      12.019154
    ],
    "after": [
      12.942515,
      12.863917,
      12.978519,
      13.119865,
      12.951538,
      12.975752,
      12.947667
    ],
    "optimized": [
      12.3478,
      12.628131,
      13.263737,
      12.328094,
      12.420875,
      12.554892,
      12.360783
    ]
  },
  "watch_total": {
    "before": [
      0.519963,
      0.516887,
      0.518054,
      0.519306,
      0.518123,
      0.524756,
      0.502604
    ],
    "after": [
      0.54564,
      0.539708,
      0.525667,
      0.530794,
      0.530208,
      0.555062,
      0.529963
    ],
    "optimized": [
      0.522417,
      0.541887,
      0.532104,
      0.519498,
      0.525854,
      0.512792,
      0.526637
    ]
  },
  "watch_reparse": {
    "before": [
      0.148373,
      0.151767,
      0.146844,
      0.147635,
      0.157015,
      0.150252,
      0.144081
    ],
    "after": [
      0.164127,
      0.162902,
      0.156292,
      0.158127,
      0.158242,
      0.166158,
      0.158519
    ],
    "optimized": [
      0.152592,
      0.157212,
      0.154783,
      0.15335,
      0.153471,
      0.150142,
      0.155723
    ]
  }
}
```
