import { describe, expect, test } from 'vitest'
import { easings, keyframes, animations, semanticAnimations } from '../src/keyframes'

describe('Open Prop preset transforms', () => {
  test('Should transform keyframes and animations correctly', () => {
    expect(easings).toMatchInlineSnapshot(`
      {
        "1": {
          "value": "cubic-bezier(.25, 0, .5, 1)",
        },
        "2": {
          "value": "cubic-bezier(.25, 0, .4, 1)",
        },
        "3": {
          "value": "cubic-bezier(.25, 0, .3, 1)",
        },
        "4": {
          "value": "cubic-bezier(.25, 0, .2, 1)",
        },
        "5": {
          "value": "cubic-bezier(.25, 0, .1, 1)",
        },
        "bounce-1": {
          "value": "linear(
          0, 0.004, 0.016, 0.035, 0.063, 0.098, 0.141, 0.191, 0.25, 0.316, 0.391 36.8%,
          0.563, 0.766, 1 58.8%, 0.946, 0.908 69.1%, 0.895, 0.885, 0.879, 0.878, 0.879,
          0.885, 0.895, 0.908 89.7%, 0.946, 1
        )",
        },
        "bounce-2": {
          "value": "linear(
          0, 0.004, 0.016, 0.035, 0.063, 0.098, 0.141 15.1%, 0.25, 0.391, 0.562, 0.765,
          1, 0.892 45.2%, 0.849, 0.815, 0.788, 0.769, 0.757, 0.753, 0.757, 0.769, 0.788,
          0.815, 0.85, 0.892 75.2%, 1 80.2%, 0.973, 0.954, 0.943, 0.939, 0.943, 0.954,
          0.973, 1
        )",
        },
        "bounce-3": {
          "value": "linear(
          0, 0.004, 0.016, 0.035, 0.062, 0.098, 0.141 11.4%, 0.25, 0.39, 0.562, 0.764,
          1 30.3%, 0.847 34.8%, 0.787, 0.737, 0.699, 0.672, 0.655, 0.65, 0.656, 0.672,
          0.699, 0.738, 0.787, 0.847 61.7%, 1 66.2%, 0.946, 0.908, 0.885 74.2%, 0.879,
          0.878, 0.879, 0.885 79.5%, 0.908, 0.946, 1 87.4%, 0.981, 0.968, 0.96, 0.957,
          0.96, 0.968, 0.981, 1
        )",
        },
        "bounce-4": {
          "value": "linear(
          0, 0.004, 0.016 3%, 0.062, 0.141, 0.25, 0.391, 0.562 18.2%, 1 24.3%, 0.81,
          0.676 32.3%, 0.629, 0.595, 0.575, 0.568, 0.575, 0.595, 0.629, 0.676 48.2%,
          0.811, 1 56.2%, 0.918, 0.86, 0.825, 0.814, 0.825, 0.86, 0.918, 1 77.2%,
          0.94 80.6%, 0.925, 0.92, 0.925, 0.94 87.5%, 1 90.9%, 0.974, 0.965, 0.974, 1
        )",
        },
        "bounce-5": {
          "value": "linear(
          0, 0.004, 0.016 2.5%, 0.063, 0.141, 0.25 10.1%, 0.562, 1 20.2%, 0.783, 0.627,
          0.534 30.9%, 0.511, 0.503, 0.511, 0.534 38%, 0.627, 0.782, 1 48.7%, 0.892,
          0.815, 0.769 56.3%, 0.757, 0.753, 0.757, 0.769 61.3%, 0.815, 0.892, 1 68.8%,
          0.908 72.4%, 0.885, 0.878, 0.885, 0.908 79.4%, 1 83%, 0.954 85.5%, 0.943,
          0.939, 0.943, 0.954 90.5%, 1 93%, 0.977, 0.97, 0.977, 1
        )",
        },
        "elastic-1": {
          "value": "{easings.elastic-out-1}",
        },
        "elastic-2": {
          "value": "{easings.elastic-out-2}",
        },
        "elastic-3": {
          "value": "{easings.elastic-out-3}",
        },
        "elastic-4": {
          "value": "{easings.elastic-out-4}",
        },
        "elastic-5": {
          "value": "{easings.elastic-out-5}",
        },
        "elastic-in-1": {
          "value": "cubic-bezier(.5, -0.25, .75, 1)",
        },
        "elastic-in-2": {
          "value": "cubic-bezier(.5, -0.50, .75, 1)",
        },
        "elastic-in-3": {
          "value": "cubic-bezier(.5, -0.75, .75, 1)",
        },
        "elastic-in-4": {
          "value": "cubic-bezier(.5, -1.00, .75, 1)",
        },
        "elastic-in-5": {
          "value": "cubic-bezier(.5, -1.25, .75, 1)",
        },
        "elastic-in-out-1": {
          "value": "cubic-bezier(.5, -.1, .1, 1.5)",
        },
        "elastic-in-out-2": {
          "value": "cubic-bezier(.5, -.3, .1, 1.5)",
        },
        "elastic-in-out-3": {
          "value": "cubic-bezier(.5, -.5, .1, 1.5)",
        },
        "elastic-in-out-4": {
          "value": "cubic-bezier(.5, -.7, .1, 1.5)",
        },
        "elastic-in-out-5": {
          "value": "cubic-bezier(.5, -.9, .1, 1.5)",
        },
        "elastic-out-1": {
          "value": "cubic-bezier(.5, .75, .75, 1.25)",
        },
        "elastic-out-2": {
          "value": "cubic-bezier(.5, 1, .75, 1.25)",
        },
        "elastic-out-3": {
          "value": "cubic-bezier(.5, 1.25, .75, 1.25)",
        },
        "elastic-out-4": {
          "value": "cubic-bezier(.5, 1.5, .75, 1.25)",
        },
        "elastic-out-5": {
          "value": "cubic-bezier(.5, 1.75, .75, 1.25)",
        },
        "in-1": {
          "value": "cubic-bezier(.25, 0, 1, 1)",
        },
        "in-2": {
          "value": "cubic-bezier(.50, 0, 1, 1)",
        },
        "in-3": {
          "value": "cubic-bezier(.70, 0, 1, 1)",
        },
        "in-4": {
          "value": "cubic-bezier(.90, 0, 1, 1)",
        },
        "in-5": {
          "value": "cubic-bezier(1, 0, 1, 1)",
        },
        "in-out-1": {
          "value": "cubic-bezier(.1, 0, .9, 1)",
        },
        "in-out-2": {
          "value": "cubic-bezier(.3, 0, .7, 1)",
        },
        "in-out-3": {
          "value": "cubic-bezier(.5, 0, .5, 1)",
        },
        "in-out-4": {
          "value": "cubic-bezier(.7, 0, .3, 1)",
        },
        "in-out-5": {
          "value": "cubic-bezier(.9, 0, .1, 1)",
        },
        "out-1": {
          "value": "cubic-bezier(0, 0, .75, 1)",
        },
        "out-2": {
          "value": "cubic-bezier(0, 0, .50, 1)",
        },
        "out-3": {
          "value": "cubic-bezier(0, 0, .3, 1)",
        },
        "out-4": {
          "value": "cubic-bezier(0, 0, .1, 1)",
        },
        "out-5": {
          "value": "cubic-bezier(0, 0, 0, 1)",
        },
        "spring-1": {
          "value": "linear(
          0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%,
          0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%,
          1.001
        )",
        },
        "spring-2": {
          "value": "linear(
          0, 0.007, 0.029 2.2%, 0.118 4.7%, 0.625 14.4%, 0.826 19%, 0.902, 0.962,
          1.008 26.1%, 1.041 28.7%, 1.064 32.1%, 1.07 36%, 1.061 40.5%, 1.015 53.4%,
          0.999 61.6%, 0.995 71.2%, 1
        )",
        },
        "spring-3": {
          "value": "linear(
          0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077,
          1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%,
          1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%,
          0.997 69.8%, 1.003 76.9%, 1
        )",
        },
        "spring-4": {
          "value": "linear(
          0, 0.009, 0.037 1.7%, 0.153 3.6%, 0.776 10.3%, 1.001, 1.142 16%, 1.185,
          1.209 19%, 1.215 19.9% 20.8%, 1.199, 1.165 25%, 1.056 30.3%, 1.008 33%, 0.973,
          0.955 39.2%, 0.953 41.1%, 0.957 43.3%, 0.998 53.3%, 1.009 59.1% 63.7%,
          0.998 78.9%, 1
        )",
        },
        "spring-5": {
          "value": "linear(
          0, 0.01, 0.04 1.6%, 0.161 3.3%, 0.816 9.4%, 1.046, 1.189 14.4%, 1.231,
          1.254 17%, 1.259, 1.257 18.6%, 1.236, 1.194 22.3%, 1.057 27%, 0.999 29.4%,
          0.955 32.1%, 0.942, 0.935 34.9%, 0.933, 0.939 38.4%, 1 47.3%, 1.011,
          1.017 52.6%, 1.016 56.4%, 1 65.2%, 0.996 70.2%, 1.001 87.2%, 1
        )",
        },
        "squish-1": {
          "value": "{easings.elastic-in-out-1}",
        },
        "squish-2": {
          "value": "{easings.elastic-in-out-2}",
        },
        "squish-3": {
          "value": "{easings.elastic-in-out-3}",
        },
        "squish-4": {
          "value": "{easings.elastic-in-out-4}",
        },
        "squish-5": {
          "value": "{easings.elastic-in-out-5}",
        },
        "step-1": {
          "value": "steps(2)",
        },
        "step-2": {
          "value": "steps(3)",
        },
        "step-3": {
          "value": "steps(4)",
        },
        "step-4": {
          "value": "steps(7)",
        },
        "step-5": {
          "value": "steps(10)",
        },
      }
    `)
    expect(keyframes).toMatchInlineSnapshot(`
      {
        "blink": {
          "0%, 100%": {
            "opacity": "1",
          },
          "50%": {
            "opacity": ".5",
          },
        },
        "bounce": {
          "0%, 60%, 100%": {
            "transform": "translateY(0)",
          },
          "25%": {
            "transform": "translateY(-20%)",
          },
          "40%": {
            "transform": "translateY(-3%)",
          },
        },
        "fade-in": {
          "to": {
            "opacity": "1",
          },
        },
        "fade-in-bloom": {
          "0%": {
            "filter": "brightness(1) blur(20px)",
            "opacity": "0",
          },
          "10%": {
            "filter": "brightness(2) blur(10px)",
            "opacity": "1",
          },
          "100%": {
            "filter": "brightness(1) blur(0)",
            "opacity": "1",
          },
        },
        "fade-in-bloom-dark": {
          "0%": {
            "filter": "brightness(1) blur(20px)",
            "opacity": "0",
          },
          "10%": {
            "filter": "brightness(0.5) blur(10px)",
            "opacity": "1",
          },
          "100%": {
            "filter": "brightness(1) blur(0)",
            "opacity": "1",
          },
        },
        "fade-out": {
          "to": {
            "opacity": "0",
          },
        },
        "fade-out-bloom": {
          "0%": {
            "filter": "brightness(1) blur(0)",
            "opacity": "1",
          },
          "10%": {
            "filter": "brightness(2) blur(10px)",
            "opacity": "1",
          },
          "100%": {
            "filter": "brightness(1) blur(20px)",
            "opacity": "0",
          },
        },
        "fade-out-bloom-dark": {
          "0%": {
            "filter": "brightness(1) blur(0)",
            "opacity": "1",
          },
          "10%": {
            "filter": "brightness(0.5) blur(10px)",
            "opacity": "1",
          },
          "100%": {
            "filter": "brightness(1) blur(20px)",
            "opacity": "0",
          },
        },
        "float": {
          "50%": {
            "transform": "translateY(-25%)",
          },
        },
        "ping": {
          "90%, 100%": {
            "opacity": "0",
            "transform": "scale(2)",
          },
        },
        "pulse": {
          "50%": {
            "transform": "scale(.9,.9)",
          },
        },
        "scale-down": {
          "to": {
            "transform": "scale(.75)",
          },
        },
        "scale-up": {
          "to": {
            "transform": "scale(1.25)",
          },
        },
        "shake-x": {
          "0%, 100%": {
            "transform": "translateX(0%)",
          },
          "20%": {
            "transform": "translateX(-5%)",
          },
          "40%": {
            "transform": "translateX(5%)",
          },
          "60%": {
            "transform": "translateX(-5%)",
          },
          "80%": {
            "transform": "translateX(5%)",
          },
        },
        "shake-y": {
          "0%, 100%": {
            "transform": "translateY(0%)",
          },
          "20%": {
            "transform": "translateY(-5%)",
          },
          "40%": {
            "transform": "translateY(5%)",
          },
          "60%": {
            "transform": "translateY(-5%)",
          },
          "80%": {
            "transform": "translateY(5%)",
          },
        },
        "slide-in-down": {
          "from": {
            "transform": "translateY(-100%)",
          },
        },
        "slide-in-left": {
          "from": {
            "transform": "translateX(100%)",
          },
        },
        "slide-in-right": {
          "from": {
            "transform": "translateX(-100%)",
          },
        },
        "slide-in-up": {
          "from": {
            "transform": "translateY(100%)",
          },
        },
        "slide-out-down": {
          "to": {
            "transform": "translateY(100%)",
          },
        },
        "slide-out-left": {
          "to": {
            "transform": "translateX(-100%)",
          },
        },
        "slide-out-right": {
          "to": {
            "transform": "translateX(100%)",
          },
        },
        "slide-out-up": {
          "to": {
            "transform": "translateY(-100%)",
          },
        },
        "spin": {
          "to": {
            "transform": "rotate(1turn)",
          },
        },
      }
    `)
    expect(animations).toMatchInlineSnapshot(`
      {
        "blink": {
          "value": "blink 1s {easings.out-3} infinite",
        },
        "bounce": {
          "value": "bounce 2s {easings.squish-2} infinite",
        },
        "fade-in": {
          "value": "fade-in .5s {easings.3}",
        },
        "fade-in-bloom": {
          "value": "fade-in-bloom 2s {easings.3}",
        },
        "fade-out": {
          "value": "fade-out .5s {easings.3}",
        },
        "fade-out-bloom": {
          "value": "fade-out-bloom 2s {easings.3}",
        },
        "float": {
          "value": "float 3s {easings.in-out-3} infinite",
        },
        "ping": {
          "value": "ping 5s {easings.out-3} infinite",
        },
        "pulse": {
          "value": "pulse 2s {easings.out-3} infinite",
        },
        "scale-down": {
          "value": "scale-down .5s {easings.3}",
        },
        "scale-up": {
          "value": "scale-up .5s {easings.3}",
        },
        "shake-x": {
          "value": "shake-x .75s {easings.out-5}",
        },
        "shake-y": {
          "value": "shake-y .75s {easings.out-5}",
        },
        "slide-in-down": {
          "value": "slide-in-down .5s {easings.3}",
        },
        "slide-in-left": {
          "value": "slide-in-left .5s {easings.3}",
        },
        "slide-in-right": {
          "value": "slide-in-right .5s {easings.3}",
        },
        "slide-in-up": {
          "value": "slide-in-up .5s {easings.3}",
        },
        "slide-out-down": {
          "value": "slide-out-down .5s {easings.3}",
        },
        "slide-out-left": {
          "value": "slide-out-left .5s {easings.3}",
        },
        "slide-out-right": {
          "value": "slide-out-right .5s {easings.3}",
        },
        "slide-out-up": {
          "value": "slide-out-up .5s {easings.3}",
        },
        "spin": {
          "value": "spin 2s linear infinite",
        },
      }
    `)
    expect(semanticAnimations).toMatchInlineSnapshot(`
      {
        "fade-in-bloom": {
          "value": {
            "_dark": "fade-in-bloom-dark 2s {easings.3}",
          },
        },
        "fade-out-bloom": {
          "value": {
            "_dark": "fade-out-bloom-dark 2s {easings.3}",
          },
        },
      }
    `)
  })
})
