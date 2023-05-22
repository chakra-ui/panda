export const schema = {
  "properties": {
    "id": "#tokensConfig",
    "properties": {
      "media": {
        "id": "#tokensConfig/media",
        "properties": {
          "sm": {
            "id": "#tokensConfig/media/sm",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/media/sm/value",
                "default": "(min-width: 640px)"
              }
            },
            "type": "object",
            "default": {
              "value": "(min-width: 640px)"
            }
          },
          "md": {
            "id": "#tokensConfig/media/md",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/media/md/value",
                "default": "(min-width: 768px)"
              }
            },
            "type": "object",
            "default": {
              "value": "(min-width: 768px)"
            }
          },
          "lg": {
            "id": "#tokensConfig/media/lg",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/media/lg/value",
                "default": "(min-width: 1024px)"
              }
            },
            "type": "object",
            "default": {
              "value": "(min-width: 1024px)"
            }
          },
          "xl": {
            "id": "#tokensConfig/media/xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/media/xl/value",
                "default": "(min-width: 1280px)"
              }
            },
            "type": "object",
            "default": {
              "value": "(min-width: 1280px)"
            }
          },
          "xxl": {
            "id": "#tokensConfig/media/xxl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/media/xxl/value",
                "default": "(min-width: 1536px)"
              }
            },
            "type": "object",
            "default": {
              "value": "(min-width: 1536px)"
            }
          }
        },
        "type": "object",
        "default": {
          "sm": {
            "value": "(min-width: 640px)"
          },
          "md": {
            "value": "(min-width: 768px)"
          },
          "lg": {
            "value": "(min-width: 1024px)"
          },
          "xl": {
            "value": "(min-width: 1280px)"
          },
          "xxl": {
            "value": "(min-width: 1536px)"
          }
        }
      },
      "font": {
        "id": "#tokensConfig/font",
        "properties": {
          "primary": {
            "id": "#tokensConfig/font/primary",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/font/primary/value",
                "default": "Inter, sans-serif"
              }
            },
            "type": "object",
            "default": {
              "value": "Inter, sans-serif"
            }
          },
          "secondary": {
            "id": "#tokensConfig/font/secondary",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/font/secondary/value",
                "default": "PaytoneOne, serif"
              }
            },
            "type": "object",
            "default": {
              "value": "PaytoneOne, serif"
            }
          }
        },
        "type": "object",
        "default": {
          "primary": {
            "value": "Inter, sans-serif"
          },
          "secondary": {
            "value": "PaytoneOne, serif"
          }
        }
      },
      "color": {
        "id": "#tokensConfig/color",
        "properties": {
          "white": {
            "id": "#tokensConfig/color/white",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/color/white/value",
                "default": "#FFFFFF"
              }
            },
            "type": "object",
            "default": {
              "value": "#FFFFFF"
            }
          },
          "black": {
            "id": "#tokensConfig/color/black",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/color/black/value",
                "default": "#191919"
              }
            },
            "type": "object",
            "default": {
              "value": "#191919"
            }
          },
          "dimmed": {
            "id": "#tokensConfig/color/dimmed",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/color/dimmed/value",
                "default": "rgba(0, 0, 0, .35)"
              }
            },
            "type": "object",
            "default": {
              "value": "rgba(0, 0, 0, .35)"
            }
          },
          "dark": {
            "id": "#tokensConfig/color/dark",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/color/dark/value",
                "default": "rgba(255, 255, 255, .15)"
              }
            },
            "type": "object",
            "default": {
              "value": "rgba(255, 255, 255, .15)"
            }
          },
          "blue": {
            "id": "#tokensConfig/color/blue",
            "properties": {
              "50": {
                "id": "#tokensConfig/color/blue/50",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/50/value",
                    "default": "#C5CDE8"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#C5CDE8"
                }
              },
              "100": {
                "id": "#tokensConfig/color/blue/100",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/100/value",
                    "default": "#B6C1E2"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#B6C1E2"
                }
              },
              "200": {
                "id": "#tokensConfig/color/blue/200",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/200/value",
                    "default": "#99A8D7"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#99A8D7"
                }
              },
              "300": {
                "id": "#tokensConfig/color/blue/300",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/300/value",
                    "default": "#7B8FCB"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#7B8FCB"
                }
              },
              "400": {
                "id": "#tokensConfig/color/blue/400",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/400/value",
                    "default": "#5E77C0"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#5E77C0"
                }
              },
              "500": {
                "id": "#tokensConfig/color/blue/500",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/500/value",
                    "default": "#4560B0"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#4560B0"
                }
              },
              "600": {
                "id": "#tokensConfig/color/blue/600",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/600/value",
                    "default": "#354A88"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#354A88"
                }
              },
              "700": {
                "id": "#tokensConfig/color/blue/700",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/700/value",
                    "default": "#25345F"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#25345F"
                }
              },
              "800": {
                "id": "#tokensConfig/color/blue/800",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/800/value",
                    "default": "#161E37"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#161E37"
                }
              },
              "900": {
                "id": "#tokensConfig/color/blue/900",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/blue/900/value",
                    "default": "#06080F"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#06080F"
                }
              }
            },
            "type": "object",
            "default": {
              "50": {
                "value": "#C5CDE8"
              },
              "100": {
                "value": "#B6C1E2"
              },
              "200": {
                "value": "#99A8D7"
              },
              "300": {
                "value": "#7B8FCB"
              },
              "400": {
                "value": "#5E77C0"
              },
              "500": {
                "value": "#4560B0"
              },
              "600": {
                "value": "#354A88"
              },
              "700": {
                "value": "#25345F"
              },
              "800": {
                "value": "#161E37"
              },
              "900": {
                "value": "#06080F"
              }
            }
          },
          "red": {
            "id": "#tokensConfig/color/red",
            "properties": {
              "50": {
                "id": "#tokensConfig/color/red/50",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/50/value",
                    "default": "#FCDFDA"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#FCDFDA"
                }
              },
              "100": {
                "id": "#tokensConfig/color/red/100",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/100/value",
                    "default": "#FACFC7"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#FACFC7"
                }
              },
              "200": {
                "id": "#tokensConfig/color/red/200",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/200/value",
                    "default": "#F7AEA2"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#F7AEA2"
                }
              },
              "300": {
                "id": "#tokensConfig/color/red/300",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/300/value",
                    "default": "#F48E7C"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#F48E7C"
                }
              },
              "400": {
                "id": "#tokensConfig/color/red/400",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/400/value",
                    "default": "#F06D57"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#F06D57"
                }
              },
              "500": {
                "id": "#tokensConfig/color/red/500",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/500/value",
                    "default": "#ED4D31"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#ED4D31"
                }
              },
              "600": {
                "id": "#tokensConfig/color/red/600",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/600/value",
                    "default": "#D32F12"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#D32F12"
                }
              },
              "700": {
                "id": "#tokensConfig/color/red/700",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/700/value",
                    "default": "#A0240E"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#A0240E"
                }
              },
              "800": {
                "id": "#tokensConfig/color/red/800",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/800/value",
                    "default": "#6C1809"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#6C1809"
                }
              },
              "900": {
                "id": "#tokensConfig/color/red/900",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/red/900/value",
                    "default": "#390D05"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#390D05"
                }
              }
            },
            "type": "object",
            "default": {
              "50": {
                "value": "#FCDFDA"
              },
              "100": {
                "value": "#FACFC7"
              },
              "200": {
                "value": "#F7AEA2"
              },
              "300": {
                "value": "#F48E7C"
              },
              "400": {
                "value": "#F06D57"
              },
              "500": {
                "value": "#ED4D31"
              },
              "600": {
                "value": "#D32F12"
              },
              "700": {
                "value": "#A0240E"
              },
              "800": {
                "value": "#6C1809"
              },
              "900": {
                "value": "#390D05"
              }
            }
          },
          "green": {
            "id": "#tokensConfig/color/green",
            "properties": {
              "50": {
                "id": "#tokensConfig/color/green/50",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/50/value",
                    "default": "#CDF4E5"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#CDF4E5"
                }
              },
              "100": {
                "id": "#tokensConfig/color/green/100",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/100/value",
                    "default": "#BCF0DC"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#BCF0DC"
                }
              },
              "200": {
                "id": "#tokensConfig/color/green/200",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/200/value",
                    "default": "#9AE9CB"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#9AE9CB"
                }
              },
              "300": {
                "id": "#tokensConfig/color/green/300",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/300/value",
                    "default": "#79E2BA"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#79E2BA"
                }
              },
              "400": {
                "id": "#tokensConfig/color/green/400",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/400/value",
                    "default": "#57DAA8"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#57DAA8"
                }
              },
              "500": {
                "id": "#tokensConfig/color/green/500",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/500/value",
                    "default": "#36D397"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#36D397"
                }
              },
              "600": {
                "id": "#tokensConfig/color/green/600",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/600/value",
                    "default": "#26AB78"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#26AB78"
                }
              },
              "700": {
                "id": "#tokensConfig/color/green/700",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/700/value",
                    "default": "#1B7D58"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#1B7D58"
                }
              },
              "800": {
                "id": "#tokensConfig/color/green/800",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/800/value",
                    "default": "#114F38"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#114F38"
                }
              },
              "900": {
                "id": "#tokensConfig/color/green/900",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/green/900/value",
                    "default": "#072117"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#072117"
                }
              }
            },
            "type": "object",
            "default": {
              "50": {
                "value": "#CDF4E5"
              },
              "100": {
                "value": "#BCF0DC"
              },
              "200": {
                "value": "#9AE9CB"
              },
              "300": {
                "value": "#79E2BA"
              },
              "400": {
                "value": "#57DAA8"
              },
              "500": {
                "value": "#36D397"
              },
              "600": {
                "value": "#26AB78"
              },
              "700": {
                "value": "#1B7D58"
              },
              "800": {
                "value": "#114F38"
              },
              "900": {
                "value": "#072117"
              }
            }
          },
          "yellow": {
            "id": "#tokensConfig/color/yellow",
            "properties": {
              "50": {
                "id": "#tokensConfig/color/yellow/50",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/50/value",
                    "default": "#FFFFFF"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#FFFFFF"
                }
              },
              "100": {
                "id": "#tokensConfig/color/yellow/100",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/100/value",
                    "default": "#FFFFFF"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#FFFFFF"
                }
              },
              "200": {
                "id": "#tokensConfig/color/yellow/200",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/200/value",
                    "default": "#FFFFFF"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#FFFFFF"
                }
              },
              "300": {
                "id": "#tokensConfig/color/yellow/300",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/300/value",
                    "default": "#FFFFFF"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#FFFFFF"
                }
              },
              "400": {
                "id": "#tokensConfig/color/yellow/400",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/400/value",
                    "default": "#FFFFFF"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#FFFFFF"
                }
              },
              "500": {
                "id": "#tokensConfig/color/yellow/500",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/500/value",
                    "default": "#FBEFDE"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#FBEFDE"
                }
              },
              "600": {
                "id": "#tokensConfig/color/yellow/600",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/600/value",
                    "default": "#F5D7AC"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#F5D7AC"
                }
              },
              "700": {
                "id": "#tokensConfig/color/yellow/700",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/700/value",
                    "default": "#EFBE7A"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#EFBE7A"
                }
              },
              "800": {
                "id": "#tokensConfig/color/yellow/800",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/800/value",
                    "default": "#E9A648"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#E9A648"
                }
              },
              "900": {
                "id": "#tokensConfig/color/yellow/900",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/yellow/900/value",
                    "default": "#DE8D1B"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#DE8D1B"
                }
              }
            },
            "type": "object",
            "default": {
              "50": {
                "value": "#FFFFFF"
              },
              "100": {
                "value": "#FFFFFF"
              },
              "200": {
                "value": "#FFFFFF"
              },
              "300": {
                "value": "#FFFFFF"
              },
              "400": {
                "value": "#FFFFFF"
              },
              "500": {
                "value": "#FBEFDE"
              },
              "600": {
                "value": "#F5D7AC"
              },
              "700": {
                "value": "#EFBE7A"
              },
              "800": {
                "value": "#E9A648"
              },
              "900": {
                "value": "#DE8D1B"
              }
            }
          },
          "grey": {
            "id": "#tokensConfig/color/grey",
            "properties": {
              "50": {
                "id": "#tokensConfig/color/grey/50",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/50/value",
                    "default": "#F7F7F7"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#F7F7F7"
                }
              },
              "100": {
                "id": "#tokensConfig/color/grey/100",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/100/value",
                    "default": "#EBEBEB"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#EBEBEB"
                }
              },
              "200": {
                "id": "#tokensConfig/color/grey/200",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/200/value",
                    "default": "#D9D9D9"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#D9D9D9"
                }
              },
              "300": {
                "id": "#tokensConfig/color/grey/300",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/300/value",
                    "default": "#C0C0C0"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#C0C0C0"
                }
              },
              "400": {
                "id": "#tokensConfig/color/grey/400",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/400/value",
                    "default": "#A8A8A8"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#A8A8A8"
                }
              },
              "500": {
                "id": "#tokensConfig/color/grey/500",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/500/value",
                    "default": "#979797"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#979797"
                }
              },
              "600": {
                "id": "#tokensConfig/color/grey/600",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/600/value",
                    "default": "#7E7E7E"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#7E7E7E"
                }
              },
              "700": {
                "id": "#tokensConfig/color/grey/700",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/700/value",
                    "default": "#656565"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#656565"
                }
              },
              "800": {
                "id": "#tokensConfig/color/grey/800",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/800/value",
                    "default": "#4D4D4D"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#4D4D4D"
                }
              },
              "900": {
                "id": "#tokensConfig/color/grey/900",
                "properties": {
                  "value": {
                    "type": "string",
                    "id": "#tokensConfig/color/grey/900/value",
                    "default": "#2E2E2E"
                  }
                },
                "type": "object",
                "default": {
                  "value": "#2E2E2E"
                }
              }
            },
            "type": "object",
            "default": {
              "50": {
                "value": "#F7F7F7"
              },
              "100": {
                "value": "#EBEBEB"
              },
              "200": {
                "value": "#D9D9D9"
              },
              "300": {
                "value": "#C0C0C0"
              },
              "400": {
                "value": "#A8A8A8"
              },
              "500": {
                "value": "#979797"
              },
              "600": {
                "value": "#7E7E7E"
              },
              "700": {
                "value": "#656565"
              },
              "800": {
                "value": "#4D4D4D"
              },
              "900": {
                "value": "#2E2E2E"
              }
            }
          },
          "primary": {
            "id": "#tokensConfig/color/primary",
            "properties": {
              "100": {
                "id": "#tokensConfig/color/primary/100",
                "properties": {
                  "value": {
                    "id": "#tokensConfig/color/primary/100/value",
                    "properties": {
                      "initial": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/100/value/initial",
                        "default": "{color.red.100}"
                      },
                      "dark": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/100/value/dark",
                        "default": "{color.red.900}"
                      }
                    },
                    "type": "object",
                    "default": {
                      "initial": "{color.red.100}",
                      "dark": "{color.red.900}"
                    }
                  }
                },
                "type": "object",
                "default": {
                  "value": {
                    "initial": "{color.red.100}",
                    "dark": "{color.red.900}"
                  }
                }
              },
              "200": {
                "id": "#tokensConfig/color/primary/200",
                "properties": {
                  "value": {
                    "id": "#tokensConfig/color/primary/200/value",
                    "properties": {
                      "initial": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/200/value/initial",
                        "default": "{color.red.200}"
                      },
                      "dark": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/200/value/dark",
                        "default": "{color.red.800}"
                      }
                    },
                    "type": "object",
                    "default": {
                      "initial": "{color.red.200}",
                      "dark": "{color.red.800}"
                    }
                  }
                },
                "type": "object",
                "default": {
                  "value": {
                    "initial": "{color.red.200}",
                    "dark": "{color.red.800}"
                  }
                }
              },
              "300": {
                "id": "#tokensConfig/color/primary/300",
                "properties": {
                  "value": {
                    "id": "#tokensConfig/color/primary/300/value",
                    "properties": {
                      "initial": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/300/value/initial",
                        "default": "{color.red.300}"
                      },
                      "dark": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/300/value/dark",
                        "default": "{color.red.700}"
                      }
                    },
                    "type": "object",
                    "default": {
                      "initial": "{color.red.300}",
                      "dark": "{color.red.700}"
                    }
                  }
                },
                "type": "object",
                "default": {
                  "value": {
                    "initial": "{color.red.300}",
                    "dark": "{color.red.700}"
                  }
                }
              },
              "400": {
                "id": "#tokensConfig/color/primary/400",
                "properties": {
                  "value": {
                    "id": "#tokensConfig/color/primary/400/value",
                    "properties": {
                      "initial": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/400/value/initial",
                        "default": "{color.red.400}"
                      },
                      "dark": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/400/value/dark",
                        "default": "{color.red.600}"
                      }
                    },
                    "type": "object",
                    "default": {
                      "initial": "{color.red.400}",
                      "dark": "{color.red.600}"
                    }
                  }
                },
                "type": "object",
                "default": {
                  "value": {
                    "initial": "{color.red.400}",
                    "dark": "{color.red.600}"
                  }
                }
              },
              "500": {
                "id": "#tokensConfig/color/primary/500",
                "properties": {
                  "value": {
                    "id": "#tokensConfig/color/primary/500/value",
                    "properties": {
                      "initial": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/500/value/initial",
                        "default": "{color.red.500}"
                      },
                      "dark": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/500/value/dark",
                        "default": "{color.red.500}"
                      }
                    },
                    "type": "object",
                    "default": {
                      "initial": "{color.red.500}",
                      "dark": "{color.red.500}"
                    }
                  }
                },
                "type": "object",
                "default": {
                  "value": {
                    "initial": "{color.red.500}",
                    "dark": "{color.red.500}"
                  }
                }
              },
              "600": {
                "id": "#tokensConfig/color/primary/600",
                "properties": {
                  "value": {
                    "id": "#tokensConfig/color/primary/600/value",
                    "properties": {
                      "initial": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/600/value/initial",
                        "default": "{color.red.600}"
                      },
                      "dark": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/600/value/dark",
                        "default": "{color.red.400}"
                      }
                    },
                    "type": "object",
                    "default": {
                      "initial": "{color.red.600}",
                      "dark": "{color.red.400}"
                    }
                  }
                },
                "type": "object",
                "default": {
                  "value": {
                    "initial": "{color.red.600}",
                    "dark": "{color.red.400}"
                  }
                }
              },
              "700": {
                "id": "#tokensConfig/color/primary/700",
                "properties": {
                  "value": {
                    "id": "#tokensConfig/color/primary/700/value",
                    "properties": {
                      "initial": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/700/value/initial",
                        "default": "{color.red.700}"
                      },
                      "dark": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/700/value/dark",
                        "default": "{color.red.300}"
                      }
                    },
                    "type": "object",
                    "default": {
                      "initial": "{color.red.700}",
                      "dark": "{color.red.300}"
                    }
                  }
                },
                "type": "object",
                "default": {
                  "value": {
                    "initial": "{color.red.700}",
                    "dark": "{color.red.300}"
                  }
                }
              },
              "800": {
                "id": "#tokensConfig/color/primary/800",
                "properties": {
                  "value": {
                    "id": "#tokensConfig/color/primary/800/value",
                    "properties": {
                      "initial": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/800/value/initial",
                        "default": "{color.red.800}"
                      },
                      "dark": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/800/value/dark",
                        "default": "{color.red.200}"
                      }
                    },
                    "type": "object",
                    "default": {
                      "initial": "{color.red.800}",
                      "dark": "{color.red.200}"
                    }
                  }
                },
                "type": "object",
                "default": {
                  "value": {
                    "initial": "{color.red.800}",
                    "dark": "{color.red.200}"
                  }
                }
              },
              "900": {
                "id": "#tokensConfig/color/primary/900",
                "properties": {
                  "value": {
                    "id": "#tokensConfig/color/primary/900/value",
                    "properties": {
                      "initial": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/900/value/initial",
                        "default": "{color.red.900}"
                      },
                      "dark": {
                        "type": "string",
                        "id": "#tokensConfig/color/primary/900/value/dark",
                        "default": "{color.red.100}"
                      }
                    },
                    "type": "object",
                    "default": {
                      "initial": "{color.red.900}",
                      "dark": "{color.red.100}"
                    }
                  }
                },
                "type": "object",
                "default": {
                  "value": {
                    "initial": "{color.red.900}",
                    "dark": "{color.red.100}"
                  }
                }
              }
            },
            "type": "object",
            "default": {
              "100": {
                "value": {
                  "initial": "{color.red.100}",
                  "dark": "{color.red.900}"
                }
              },
              "200": {
                "value": {
                  "initial": "{color.red.200}",
                  "dark": "{color.red.800}"
                }
              },
              "300": {
                "value": {
                  "initial": "{color.red.300}",
                  "dark": "{color.red.700}"
                }
              },
              "400": {
                "value": {
                  "initial": "{color.red.400}",
                  "dark": "{color.red.600}"
                }
              },
              "500": {
                "value": {
                  "initial": "{color.red.500}",
                  "dark": "{color.red.500}"
                }
              },
              "600": {
                "value": {
                  "initial": "{color.red.600}",
                  "dark": "{color.red.400}"
                }
              },
              "700": {
                "value": {
                  "initial": "{color.red.700}",
                  "dark": "{color.red.300}"
                }
              },
              "800": {
                "value": {
                  "initial": "{color.red.800}",
                  "dark": "{color.red.200}"
                }
              },
              "900": {
                "value": {
                  "initial": "{color.red.900}",
                  "dark": "{color.red.100}"
                }
              }
            }
          }
        },
        "type": "object",
        "default": {
          "white": {
            "value": "#FFFFFF"
          },
          "black": {
            "value": "#191919"
          },
          "dimmed": {
            "value": "rgba(0, 0, 0, .35)"
          },
          "dark": {
            "value": "rgba(255, 255, 255, .15)"
          },
          "blue": {
            "50": {
              "value": "#C5CDE8"
            },
            "100": {
              "value": "#B6C1E2"
            },
            "200": {
              "value": "#99A8D7"
            },
            "300": {
              "value": "#7B8FCB"
            },
            "400": {
              "value": "#5E77C0"
            },
            "500": {
              "value": "#4560B0"
            },
            "600": {
              "value": "#354A88"
            },
            "700": {
              "value": "#25345F"
            },
            "800": {
              "value": "#161E37"
            },
            "900": {
              "value": "#06080F"
            }
          },
          "red": {
            "50": {
              "value": "#FCDFDA"
            },
            "100": {
              "value": "#FACFC7"
            },
            "200": {
              "value": "#F7AEA2"
            },
            "300": {
              "value": "#F48E7C"
            },
            "400": {
              "value": "#F06D57"
            },
            "500": {
              "value": "#ED4D31"
            },
            "600": {
              "value": "#D32F12"
            },
            "700": {
              "value": "#A0240E"
            },
            "800": {
              "value": "#6C1809"
            },
            "900": {
              "value": "#390D05"
            }
          },
          "green": {
            "50": {
              "value": "#CDF4E5"
            },
            "100": {
              "value": "#BCF0DC"
            },
            "200": {
              "value": "#9AE9CB"
            },
            "300": {
              "value": "#79E2BA"
            },
            "400": {
              "value": "#57DAA8"
            },
            "500": {
              "value": "#36D397"
            },
            "600": {
              "value": "#26AB78"
            },
            "700": {
              "value": "#1B7D58"
            },
            "800": {
              "value": "#114F38"
            },
            "900": {
              "value": "#072117"
            }
          },
          "yellow": {
            "50": {
              "value": "#FFFFFF"
            },
            "100": {
              "value": "#FFFFFF"
            },
            "200": {
              "value": "#FFFFFF"
            },
            "300": {
              "value": "#FFFFFF"
            },
            "400": {
              "value": "#FFFFFF"
            },
            "500": {
              "value": "#FBEFDE"
            },
            "600": {
              "value": "#F5D7AC"
            },
            "700": {
              "value": "#EFBE7A"
            },
            "800": {
              "value": "#E9A648"
            },
            "900": {
              "value": "#DE8D1B"
            }
          },
          "grey": {
            "50": {
              "value": "#F7F7F7"
            },
            "100": {
              "value": "#EBEBEB"
            },
            "200": {
              "value": "#D9D9D9"
            },
            "300": {
              "value": "#C0C0C0"
            },
            "400": {
              "value": "#A8A8A8"
            },
            "500": {
              "value": "#979797"
            },
            "600": {
              "value": "#7E7E7E"
            },
            "700": {
              "value": "#656565"
            },
            "800": {
              "value": "#4D4D4D"
            },
            "900": {
              "value": "#2E2E2E"
            }
          },
          "primary": {
            "100": {
              "value": {
                "initial": "{color.red.100}",
                "dark": "{color.red.900}"
              }
            },
            "200": {
              "value": {
                "initial": "{color.red.200}",
                "dark": "{color.red.800}"
              }
            },
            "300": {
              "value": {
                "initial": "{color.red.300}",
                "dark": "{color.red.700}"
              }
            },
            "400": {
              "value": {
                "initial": "{color.red.400}",
                "dark": "{color.red.600}"
              }
            },
            "500": {
              "value": {
                "initial": "{color.red.500}",
                "dark": "{color.red.500}"
              }
            },
            "600": {
              "value": {
                "initial": "{color.red.600}",
                "dark": "{color.red.400}"
              }
            },
            "700": {
              "value": {
                "initial": "{color.red.700}",
                "dark": "{color.red.300}"
              }
            },
            "800": {
              "value": {
                "initial": "{color.red.800}",
                "dark": "{color.red.200}"
              }
            },
            "900": {
              "value": {
                "initial": "{color.red.900}",
                "dark": "{color.red.100}"
              }
            }
          }
        }
      },
      "shadow": {
        "id": "#tokensConfig/shadow",
        "properties": {
          "xs": {
            "id": "#tokensConfig/shadow/xs",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/shadow/xs/value",
                "default": "0 1px 2px 0 {color.grey.800}"
              }
            },
            "type": "object",
            "default": {
              "value": "0 1px 2px 0 {color.grey.800}"
            }
          },
          "sm": {
            "id": "#tokensConfig/shadow/sm",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/shadow/sm/value",
                "default": "0 1px 2px -1px {color.grey.800}, 0 1px 3px 0 {color.grey.800}"
              }
            },
            "type": "object",
            "default": {
              "value": "0 1px 2px -1px {color.grey.800}, 0 1px 3px 0 {color.grey.800}"
            }
          },
          "md": {
            "id": "#tokensConfig/shadow/md",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/shadow/md/value",
                "default": "0 2px 4px -2px {color.grey.800}, 0 4px 6px -1px {color.grey.800}"
              }
            },
            "type": "object",
            "default": {
              "value": "0 2px 4px -2px {color.grey.800}, 0 4px 6px -1px {color.grey.800}"
            }
          },
          "lg": {
            "id": "#tokensConfig/shadow/lg",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/shadow/lg/value",
                "default": "0 4px 6px -4px {color.grey.800}, 0 10px 15px -3px {color.grey.800}"
              }
            },
            "type": "object",
            "default": {
              "value": "0 4px 6px -4px {color.grey.800}, 0 10px 15px -3px {color.grey.800}"
            }
          },
          "xl": {
            "id": "#tokensConfig/shadow/xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/shadow/xl/value",
                "default": "0 8px 10px -6px {color.grey.800}, 0 20px 25px -5px {color.grey.800}"
              }
            },
            "type": "object",
            "default": {
              "value": "0 8px 10px -6px {color.grey.800}, 0 20px 25px -5px {color.grey.800}"
            }
          },
          "xxl": {
            "id": "#tokensConfig/shadow/xxl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/shadow/xxl/value",
                "default": "0 25px 50px -12px {color.grey.800}"
              }
            },
            "type": "object",
            "default": {
              "value": "0 25px 50px -12px {color.grey.800}"
            }
          }
        },
        "type": "object",
        "default": {
          "xs": {
            "value": "0 1px 2px 0 {color.grey.800}"
          },
          "sm": {
            "value": "0 1px 2px -1px {color.grey.800}, 0 1px 3px 0 {color.grey.800}"
          },
          "md": {
            "value": "0 2px 4px -2px {color.grey.800}, 0 4px 6px -1px {color.grey.800}"
          },
          "lg": {
            "value": "0 4px 6px -4px {color.grey.800}, 0 10px 15px -3px {color.grey.800}"
          },
          "xl": {
            "value": "0 8px 10px -6px {color.grey.800}, 0 20px 25px -5px {color.grey.800}"
          },
          "xxl": {
            "value": "0 25px 50px -12px {color.grey.800}"
          }
        }
      },
      "fontWeight": {
        "id": "#tokensConfig/fontWeight",
        "properties": {
          "thin": {
            "id": "#tokensConfig/fontWeight/thin",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/fontWeight/thin/value",
                "default": 100
              }
            },
            "type": "object",
            "default": {
              "value": 100
            }
          },
          "extralight": {
            "id": "#tokensConfig/fontWeight/extralight",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/fontWeight/extralight/value",
                "default": 200
              }
            },
            "type": "object",
            "default": {
              "value": 200
            }
          },
          "light": {
            "id": "#tokensConfig/fontWeight/light",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/fontWeight/light/value",
                "default": 300
              }
            },
            "type": "object",
            "default": {
              "value": 300
            }
          },
          "normal": {
            "id": "#tokensConfig/fontWeight/normal",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/fontWeight/normal/value",
                "default": 400
              }
            },
            "type": "object",
            "default": {
              "value": 400
            }
          },
          "medium": {
            "id": "#tokensConfig/fontWeight/medium",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/fontWeight/medium/value",
                "default": 500
              }
            },
            "type": "object",
            "default": {
              "value": 500
            }
          },
          "semibold": {
            "id": "#tokensConfig/fontWeight/semibold",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/fontWeight/semibold/value",
                "default": 600
              }
            },
            "type": "object",
            "default": {
              "value": 600
            }
          },
          "bold": {
            "id": "#tokensConfig/fontWeight/bold",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/fontWeight/bold/value",
                "default": 700
              }
            },
            "type": "object",
            "default": {
              "value": 700
            }
          },
          "extrabold": {
            "id": "#tokensConfig/fontWeight/extrabold",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/fontWeight/extrabold/value",
                "default": 800
              }
            },
            "type": "object",
            "default": {
              "value": 800
            }
          },
          "black": {
            "id": "#tokensConfig/fontWeight/black",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/fontWeight/black/value",
                "default": 900
              }
            },
            "type": "object",
            "default": {
              "value": 900
            }
          }
        },
        "type": "object",
        "default": {
          "thin": {
            "value": 100
          },
          "extralight": {
            "value": 200
          },
          "light": {
            "value": 300
          },
          "normal": {
            "value": 400
          },
          "medium": {
            "value": 500
          },
          "semibold": {
            "value": 600
          },
          "bold": {
            "value": 700
          },
          "extrabold": {
            "value": 800
          },
          "black": {
            "value": 900
          }
        }
      },
      "fontSize": {
        "id": "#tokensConfig/fontSize",
        "properties": {
          "xs": {
            "id": "#tokensConfig/fontSize/xs",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/xs/value",
                "default": "12px"
              }
            },
            "type": "object",
            "default": {
              "value": "12px"
            }
          },
          "sm": {
            "id": "#tokensConfig/fontSize/sm",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/sm/value",
                "default": "14px"
              }
            },
            "type": "object",
            "default": {
              "value": "14px"
            }
          },
          "md": {
            "id": "#tokensConfig/fontSize/md",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/md/value",
                "default": "16px"
              }
            },
            "type": "object",
            "default": {
              "value": "16px"
            }
          },
          "lg": {
            "id": "#tokensConfig/fontSize/lg",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/lg/value",
                "default": "18px"
              }
            },
            "type": "object",
            "default": {
              "value": "18px"
            }
          },
          "xl": {
            "id": "#tokensConfig/fontSize/xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/xl/value",
                "default": "20px"
              }
            },
            "type": "object",
            "default": {
              "value": "20px"
            }
          },
          "xxl": {
            "id": "#tokensConfig/fontSize/xxl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/xxl/value",
                "default": "24px"
              }
            },
            "type": "object",
            "default": {
              "value": "24px"
            }
          },
          "3xl": {
            "id": "#tokensConfig/fontSize/3xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/3xl/value",
                "default": "30px"
              }
            },
            "type": "object",
            "default": {
              "value": "30px"
            }
          },
          "4xl": {
            "id": "#tokensConfig/fontSize/4xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/4xl/value",
                "default": "36px"
              }
            },
            "type": "object",
            "default": {
              "value": "36px"
            }
          },
          "5xl": {
            "id": "#tokensConfig/fontSize/5xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/5xl/value",
                "default": "48px"
              }
            },
            "type": "object",
            "default": {
              "value": "48px"
            }
          },
          "6xl": {
            "id": "#tokensConfig/fontSize/6xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/6xl/value",
                "default": "60px"
              }
            },
            "type": "object",
            "default": {
              "value": "60px"
            }
          },
          "7xl": {
            "id": "#tokensConfig/fontSize/7xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/7xl/value",
                "default": "72px"
              }
            },
            "type": "object",
            "default": {
              "value": "72px"
            }
          },
          "8xl": {
            "id": "#tokensConfig/fontSize/8xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/8xl/value",
                "default": "96px"
              }
            },
            "type": "object",
            "default": {
              "value": "96px"
            }
          },
          "9xl": {
            "id": "#tokensConfig/fontSize/9xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/fontSize/9xl/value",
                "default": "128px"
              }
            },
            "type": "object",
            "default": {
              "value": "128px"
            }
          }
        },
        "type": "object",
        "default": {
          "xs": {
            "value": "12px"
          },
          "sm": {
            "value": "14px"
          },
          "md": {
            "value": "16px"
          },
          "lg": {
            "value": "18px"
          },
          "xl": {
            "value": "20px"
          },
          "xxl": {
            "value": "24px"
          },
          "3xl": {
            "value": "30px"
          },
          "4xl": {
            "value": "36px"
          },
          "5xl": {
            "value": "48px"
          },
          "6xl": {
            "value": "60px"
          },
          "7xl": {
            "value": "72px"
          },
          "8xl": {
            "value": "96px"
          },
          "9xl": {
            "value": "128px"
          }
        }
      },
      "letterSpacing": {
        "id": "#tokensConfig/letterSpacing",
        "properties": {
          "tighter": {
            "id": "#tokensConfig/letterSpacing/tighter",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/letterSpacing/tighter/value",
                "default": "-.05em"
              }
            },
            "type": "object",
            "default": {
              "value": "-.05em"
            }
          },
          "tight": {
            "id": "#tokensConfig/letterSpacing/tight",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/letterSpacing/tight/value",
                "default": "-0025em"
              }
            },
            "type": "object",
            "default": {
              "value": "-0025em"
            }
          },
          "normal": {
            "id": "#tokensConfig/letterSpacing/normal",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/letterSpacing/normal/value",
                "default": "0em"
              }
            },
            "type": "object",
            "default": {
              "value": "0em"
            }
          },
          "wide": {
            "id": "#tokensConfig/letterSpacing/wide",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/letterSpacing/wide/value",
                "default": "0025em"
              }
            },
            "type": "object",
            "default": {
              "value": "0025em"
            }
          },
          "wider": {
            "id": "#tokensConfig/letterSpacing/wider",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/letterSpacing/wider/value",
                "default": ".05em"
              }
            },
            "type": "object",
            "default": {
              "value": ".05em"
            }
          },
          "widest": {
            "id": "#tokensConfig/letterSpacing/widest",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/letterSpacing/widest/value",
                "default": "0.1em"
              }
            },
            "type": "object",
            "default": {
              "value": "0.1em"
            }
          }
        },
        "type": "object",
        "default": {
          "tighter": {
            "value": "-.05em"
          },
          "tight": {
            "value": "-0025em"
          },
          "normal": {
            "value": "0em"
          },
          "wide": {
            "value": "0025em"
          },
          "wider": {
            "value": ".05em"
          },
          "widest": {
            "value": "0.1em"
          }
        }
      },
      "lead": {
        "id": "#tokensConfig/lead",
        "properties": {
          "none": {
            "id": "#tokensConfig/lead/none",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/lead/none/value",
                "default": 1
              }
            },
            "type": "object",
            "default": {
              "value": 1
            }
          },
          "tight": {
            "id": "#tokensConfig/lead/tight",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/lead/tight/value",
                "default": 1.25
              }
            },
            "type": "object",
            "default": {
              "value": 1.25
            }
          },
          "snug": {
            "id": "#tokensConfig/lead/snug",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/lead/snug/value",
                "default": 1.375
              }
            },
            "type": "object",
            "default": {
              "value": 1.375
            }
          },
          "normal": {
            "id": "#tokensConfig/lead/normal",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/lead/normal/value",
                "default": 1.5
              }
            },
            "type": "object",
            "default": {
              "value": 1.5
            }
          },
          "relaxed": {
            "id": "#tokensConfig/lead/relaxed",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/lead/relaxed/value",
                "default": 1.625
              }
            },
            "type": "object",
            "default": {
              "value": 1.625
            }
          },
          "loose": {
            "id": "#tokensConfig/lead/loose",
            "properties": {
              "value": {
                "type": "number",
                "id": "#tokensConfig/lead/loose/value",
                "default": 2
              }
            },
            "type": "object",
            "default": {
              "value": 2
            }
          }
        },
        "type": "object",
        "default": {
          "none": {
            "value": 1
          },
          "tight": {
            "value": 1.25
          },
          "snug": {
            "value": 1.375
          },
          "normal": {
            "value": 1.5
          },
          "relaxed": {
            "value": 1.625
          },
          "loose": {
            "value": 2
          }
        }
      },
      "radii": {
        "id": "#tokensConfig/radii",
        "properties": {
          "2xs": {
            "id": "#tokensConfig/radii/2xs",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/radii/2xs/value",
                "default": "0.125rem"
              }
            },
            "type": "object",
            "default": {
              "value": "0.125rem"
            }
          },
          "xs": {
            "id": "#tokensConfig/radii/xs",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/radii/xs/value",
                "default": "0.25rem"
              }
            },
            "type": "object",
            "default": {
              "value": "0.25rem"
            }
          },
          "sm": {
            "id": "#tokensConfig/radii/sm",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/radii/sm/value",
                "default": "0.375rem"
              }
            },
            "type": "object",
            "default": {
              "value": "0.375rem"
            }
          },
          "md": {
            "id": "#tokensConfig/radii/md",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/radii/md/value",
                "default": "0.5rem"
              }
            },
            "type": "object",
            "default": {
              "value": "0.5rem"
            }
          },
          "lg": {
            "id": "#tokensConfig/radii/lg",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/radii/lg/value",
                "default": "1rem"
              }
            },
            "type": "object",
            "default": {
              "value": "1rem"
            }
          },
          "xl": {
            "id": "#tokensConfig/radii/xl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/radii/xl/value",
                "default": "1rem"
              }
            },
            "type": "object",
            "default": {
              "value": "1rem"
            }
          },
          "xxl": {
            "id": "#tokensConfig/radii/xxl",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/radii/xxl/value",
                "default": "1.5rem"
              }
            },
            "type": "object",
            "default": {
              "value": "1.5rem"
            }
          },
          "full": {
            "id": "#tokensConfig/radii/full",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/radii/full/value",
                "default": "9999px"
              }
            },
            "type": "object",
            "default": {
              "value": "9999px"
            }
          }
        },
        "type": "object",
        "default": {
          "2xs": {
            "value": "0.125rem"
          },
          "xs": {
            "value": "0.25rem"
          },
          "sm": {
            "value": "0.375rem"
          },
          "md": {
            "value": "0.5rem"
          },
          "lg": {
            "value": "1rem"
          },
          "xl": {
            "value": "1rem"
          },
          "xxl": {
            "value": "1.5rem"
          },
          "full": {
            "value": "9999px"
          }
        }
      },
      "size": {
        "id": "#tokensConfig/size",
        "properties": {
          "4": {
            "id": "#tokensConfig/size/4",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/4/value",
                "default": "4px"
              }
            },
            "type": "object",
            "default": {
              "value": "4px"
            }
          },
          "6": {
            "id": "#tokensConfig/size/6",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/6/value",
                "default": "6px"
              }
            },
            "type": "object",
            "default": {
              "value": "6px"
            }
          },
          "8": {
            "id": "#tokensConfig/size/8",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/8/value",
                "default": "8px"
              }
            },
            "type": "object",
            "default": {
              "value": "8px"
            }
          },
          "12": {
            "id": "#tokensConfig/size/12",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/12/value",
                "default": "12px"
              }
            },
            "type": "object",
            "default": {
              "value": "12px"
            }
          },
          "16": {
            "id": "#tokensConfig/size/16",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/16/value",
                "default": "16px"
              }
            },
            "type": "object",
            "default": {
              "value": "16px"
            }
          },
          "20": {
            "id": "#tokensConfig/size/20",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/20/value",
                "default": "20px"
              }
            },
            "type": "object",
            "default": {
              "value": "20px"
            }
          },
          "24": {
            "id": "#tokensConfig/size/24",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/24/value",
                "default": "24px"
              }
            },
            "type": "object",
            "default": {
              "value": "24px"
            }
          },
          "32": {
            "id": "#tokensConfig/size/32",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/32/value",
                "default": "32px"
              }
            },
            "type": "object",
            "default": {
              "value": "32px"
            }
          },
          "40": {
            "id": "#tokensConfig/size/40",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/40/value",
                "default": "40px"
              }
            },
            "type": "object",
            "default": {
              "value": "40px"
            }
          },
          "48": {
            "id": "#tokensConfig/size/48",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/48/value",
                "default": "48px"
              }
            },
            "type": "object",
            "default": {
              "value": "48px"
            }
          },
          "56": {
            "id": "#tokensConfig/size/56",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/56/value",
                "default": "56px"
              }
            },
            "type": "object",
            "default": {
              "value": "56px"
            }
          },
          "64": {
            "id": "#tokensConfig/size/64",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/64/value",
                "default": "64px"
              }
            },
            "type": "object",
            "default": {
              "value": "64px"
            }
          },
          "80": {
            "id": "#tokensConfig/size/80",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/80/value",
                "default": "80px"
              }
            },
            "type": "object",
            "default": {
              "value": "80px"
            }
          },
          "104": {
            "id": "#tokensConfig/size/104",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/104/value",
                "default": "104px"
              }
            },
            "type": "object",
            "default": {
              "value": "104px"
            }
          },
          "200": {
            "id": "#tokensConfig/size/200",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/size/200/value",
                "default": "200px"
              }
            },
            "type": "object",
            "default": {
              "value": "200px"
            }
          }
        },
        "type": "object",
        "default": {
          "4": {
            "value": "4px"
          },
          "6": {
            "value": "6px"
          },
          "8": {
            "value": "8px"
          },
          "12": {
            "value": "12px"
          },
          "16": {
            "value": "16px"
          },
          "20": {
            "value": "20px"
          },
          "24": {
            "value": "24px"
          },
          "32": {
            "value": "32px"
          },
          "40": {
            "value": "40px"
          },
          "48": {
            "value": "48px"
          },
          "56": {
            "value": "56px"
          },
          "64": {
            "value": "64px"
          },
          "80": {
            "value": "80px"
          },
          "104": {
            "value": "104px"
          },
          "200": {
            "value": "200px"
          }
        }
      },
      "space": {
        "id": "#tokensConfig/space",
        "properties": {
          "0": {
            "id": "#tokensConfig/space/0",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/0/value",
                "default": "0"
              }
            },
            "type": "object",
            "default": {
              "value": "0"
            }
          },
          "1": {
            "id": "#tokensConfig/space/1",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/1/value",
                "default": "1px"
              }
            },
            "type": "object",
            "default": {
              "value": "1px"
            }
          },
          "2": {
            "id": "#tokensConfig/space/2",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/2/value",
                "default": "2px"
              }
            },
            "type": "object",
            "default": {
              "value": "2px"
            }
          },
          "4": {
            "id": "#tokensConfig/space/4",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/4/value",
                "default": "4px"
              }
            },
            "type": "object",
            "default": {
              "value": "4px"
            }
          },
          "6": {
            "id": "#tokensConfig/space/6",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/6/value",
                "default": "6px"
              }
            },
            "type": "object",
            "default": {
              "value": "6px"
            }
          },
          "8": {
            "id": "#tokensConfig/space/8",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/8/value",
                "default": "8px"
              }
            },
            "type": "object",
            "default": {
              "value": "8px"
            }
          },
          "10": {
            "id": "#tokensConfig/space/10",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/10/value",
                "default": "10px"
              }
            },
            "type": "object",
            "default": {
              "value": "10px"
            }
          },
          "12": {
            "id": "#tokensConfig/space/12",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/12/value",
                "default": "12px"
              }
            },
            "type": "object",
            "default": {
              "value": "12px"
            }
          },
          "16": {
            "id": "#tokensConfig/space/16",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/16/value",
                "default": "16px"
              }
            },
            "type": "object",
            "default": {
              "value": "16px"
            }
          },
          "20": {
            "id": "#tokensConfig/space/20",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/20/value",
                "default": "20px"
              }
            },
            "type": "object",
            "default": {
              "value": "20px"
            }
          },
          "24": {
            "id": "#tokensConfig/space/24",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/24/value",
                "default": "24px"
              }
            },
            "type": "object",
            "default": {
              "value": "24px"
            }
          },
          "32": {
            "id": "#tokensConfig/space/32",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/32/value",
                "default": "32px"
              }
            },
            "type": "object",
            "default": {
              "value": "32px"
            }
          },
          "40": {
            "id": "#tokensConfig/space/40",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/40/value",
                "default": "40px"
              }
            },
            "type": "object",
            "default": {
              "value": "40px"
            }
          },
          "44": {
            "id": "#tokensConfig/space/44",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/44/value",
                "default": "44px"
              }
            },
            "type": "object",
            "default": {
              "value": "44px"
            }
          },
          "48": {
            "id": "#tokensConfig/space/48",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/48/value",
                "default": "48px"
              }
            },
            "type": "object",
            "default": {
              "value": "48px"
            }
          },
          "56": {
            "id": "#tokensConfig/space/56",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/56/value",
                "default": "56px"
              }
            },
            "type": "object",
            "default": {
              "value": "56px"
            }
          },
          "64": {
            "id": "#tokensConfig/space/64",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/64/value",
                "default": "64px"
              }
            },
            "type": "object",
            "default": {
              "value": "64px"
            }
          },
          "80": {
            "id": "#tokensConfig/space/80",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/80/value",
                "default": "80px"
              }
            },
            "type": "object",
            "default": {
              "value": "80px"
            }
          },
          "104": {
            "id": "#tokensConfig/space/104",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/104/value",
                "default": "104px"
              }
            },
            "type": "object",
            "default": {
              "value": "104px"
            }
          },
          "140": {
            "id": "#tokensConfig/space/140",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/140/value",
                "default": "140px"
              }
            },
            "type": "object",
            "default": {
              "value": "140px"
            }
          },
          "200": {
            "id": "#tokensConfig/space/200",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/space/200/value",
                "default": "200px"
              }
            },
            "type": "object",
            "default": {
              "value": "200px"
            }
          }
        },
        "type": "object",
        "default": {
          "0": {
            "value": "0"
          },
          "1": {
            "value": "1px"
          },
          "2": {
            "value": "2px"
          },
          "4": {
            "value": "4px"
          },
          "6": {
            "value": "6px"
          },
          "8": {
            "value": "8px"
          },
          "10": {
            "value": "10px"
          },
          "12": {
            "value": "12px"
          },
          "16": {
            "value": "16px"
          },
          "20": {
            "value": "20px"
          },
          "24": {
            "value": "24px"
          },
          "32": {
            "value": "32px"
          },
          "40": {
            "value": "40px"
          },
          "44": {
            "value": "44px"
          },
          "48": {
            "value": "48px"
          },
          "56": {
            "value": "56px"
          },
          "64": {
            "value": "64px"
          },
          "80": {
            "value": "80px"
          },
          "104": {
            "value": "104px"
          },
          "140": {
            "value": "140px"
          },
          "200": {
            "value": "200px"
          }
        }
      },
      "borderWidth": {
        "id": "#tokensConfig/borderWidth",
        "properties": {
          "noBorder": {
            "id": "#tokensConfig/borderWidth/noBorder",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/borderWidth/noBorder/value",
                "default": "0"
              }
            },
            "type": "object",
            "default": {
              "value": "0"
            }
          },
          "sm": {
            "id": "#tokensConfig/borderWidth/sm",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/borderWidth/sm/value",
                "default": "1px"
              }
            },
            "type": "object",
            "default": {
              "value": "1px"
            }
          },
          "md": {
            "id": "#tokensConfig/borderWidth/md",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/borderWidth/md/value",
                "default": "2px"
              }
            },
            "type": "object",
            "default": {
              "value": "2px"
            }
          },
          "lg": {
            "id": "#tokensConfig/borderWidth/lg",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/borderWidth/lg/value",
                "default": "3px"
              }
            },
            "type": "object",
            "default": {
              "value": "3px"
            }
          }
        },
        "type": "object",
        "default": {
          "noBorder": {
            "value": "0"
          },
          "sm": {
            "value": "1px"
          },
          "md": {
            "value": "2px"
          },
          "lg": {
            "value": "3px"
          }
        }
      },
      "opacity": {
        "id": "#tokensConfig/opacity",
        "properties": {
          "noOpacity": {
            "id": "#tokensConfig/opacity/noOpacity",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/opacity/noOpacity/value",
                "default": "0"
              }
            },
            "type": "object",
            "default": {
              "value": "0"
            }
          },
          "bright": {
            "id": "#tokensConfig/opacity/bright",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/opacity/bright/value",
                "default": "0.1"
              }
            },
            "type": "object",
            "default": {
              "value": "0.1"
            }
          },
          "light": {
            "id": "#tokensConfig/opacity/light",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/opacity/light/value",
                "default": "0.15"
              }
            },
            "type": "object",
            "default": {
              "value": "0.15"
            }
          },
          "soft": {
            "id": "#tokensConfig/opacity/soft",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/opacity/soft/value",
                "default": "0.3"
              }
            },
            "type": "object",
            "default": {
              "value": "0.3"
            }
          },
          "medium": {
            "id": "#tokensConfig/opacity/medium",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/opacity/medium/value",
                "default": "0.5"
              }
            },
            "type": "object",
            "default": {
              "value": "0.5"
            }
          },
          "high": {
            "id": "#tokensConfig/opacity/high",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/opacity/high/value",
                "default": "0.8"
              }
            },
            "type": "object",
            "default": {
              "value": "0.8"
            }
          },
          "total": {
            "id": "#tokensConfig/opacity/total",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/opacity/total/value",
                "default": "1"
              }
            },
            "type": "object",
            "default": {
              "value": "1"
            }
          }
        },
        "type": "object",
        "default": {
          "noOpacity": {
            "value": "0"
          },
          "bright": {
            "value": "0.1"
          },
          "light": {
            "value": "0.15"
          },
          "soft": {
            "value": "0.3"
          },
          "medium": {
            "value": "0.5"
          },
          "high": {
            "value": "0.8"
          },
          "total": {
            "value": "1"
          }
        }
      },
      "zIndex": {
        "id": "#tokensConfig/zIndex",
        "properties": {
          "0": {
            "id": "#tokensConfig/zIndex/0",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/0/value",
                "default": "0"
              }
            },
            "type": "object",
            "default": {
              "value": "0"
            }
          },
          "1": {
            "id": "#tokensConfig/zIndex/1",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/1/value",
                "default": "1px"
              }
            },
            "type": "object",
            "default": {
              "value": "1px"
            }
          },
          "2": {
            "id": "#tokensConfig/zIndex/2",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/2/value",
                "default": "2px"
              }
            },
            "type": "object",
            "default": {
              "value": "2px"
            }
          },
          "4": {
            "id": "#tokensConfig/zIndex/4",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/4/value",
                "default": "4px"
              }
            },
            "type": "object",
            "default": {
              "value": "4px"
            }
          },
          "6": {
            "id": "#tokensConfig/zIndex/6",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/6/value",
                "default": "6px"
              }
            },
            "type": "object",
            "default": {
              "value": "6px"
            }
          },
          "8": {
            "id": "#tokensConfig/zIndex/8",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/8/value",
                "default": "8px"
              }
            },
            "type": "object",
            "default": {
              "value": "8px"
            }
          },
          "10": {
            "id": "#tokensConfig/zIndex/10",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/10/value",
                "default": "10px"
              }
            },
            "type": "object",
            "default": {
              "value": "10px"
            }
          },
          "12": {
            "id": "#tokensConfig/zIndex/12",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/12/value",
                "default": "12px"
              }
            },
            "type": "object",
            "default": {
              "value": "12px"
            }
          },
          "16": {
            "id": "#tokensConfig/zIndex/16",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/16/value",
                "default": "16px"
              }
            },
            "type": "object",
            "default": {
              "value": "16px"
            }
          },
          "20": {
            "id": "#tokensConfig/zIndex/20",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/20/value",
                "default": "20px"
              }
            },
            "type": "object",
            "default": {
              "value": "20px"
            }
          },
          "24": {
            "id": "#tokensConfig/zIndex/24",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/24/value",
                "default": "24px"
              }
            },
            "type": "object",
            "default": {
              "value": "24px"
            }
          },
          "32": {
            "id": "#tokensConfig/zIndex/32",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/32/value",
                "default": "32px"
              }
            },
            "type": "object",
            "default": {
              "value": "32px"
            }
          },
          "40": {
            "id": "#tokensConfig/zIndex/40",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/40/value",
                "default": "40px"
              }
            },
            "type": "object",
            "default": {
              "value": "40px"
            }
          },
          "44": {
            "id": "#tokensConfig/zIndex/44",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/44/value",
                "default": "44px"
              }
            },
            "type": "object",
            "default": {
              "value": "44px"
            }
          },
          "48": {
            "id": "#tokensConfig/zIndex/48",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/48/value",
                "default": "48px"
              }
            },
            "type": "object",
            "default": {
              "value": "48px"
            }
          },
          "56": {
            "id": "#tokensConfig/zIndex/56",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/56/value",
                "default": "56px"
              }
            },
            "type": "object",
            "default": {
              "value": "56px"
            }
          },
          "64": {
            "id": "#tokensConfig/zIndex/64",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/64/value",
                "default": "64px"
              }
            },
            "type": "object",
            "default": {
              "value": "64px"
            }
          },
          "80": {
            "id": "#tokensConfig/zIndex/80",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/80/value",
                "default": "80px"
              }
            },
            "type": "object",
            "default": {
              "value": "80px"
            }
          },
          "104": {
            "id": "#tokensConfig/zIndex/104",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/104/value",
                "default": "104px"
              }
            },
            "type": "object",
            "default": {
              "value": "104px"
            }
          },
          "140": {
            "id": "#tokensConfig/zIndex/140",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/140/value",
                "default": "140px"
              }
            },
            "type": "object",
            "default": {
              "value": "140px"
            }
          },
          "200": {
            "id": "#tokensConfig/zIndex/200",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/zIndex/200/value",
                "default": "200px"
              }
            },
            "type": "object",
            "default": {
              "value": "200px"
            }
          }
        },
        "type": "object",
        "default": {
          "0": {
            "value": "0"
          },
          "1": {
            "value": "1px"
          },
          "2": {
            "value": "2px"
          },
          "4": {
            "value": "4px"
          },
          "6": {
            "value": "6px"
          },
          "8": {
            "value": "8px"
          },
          "10": {
            "value": "10px"
          },
          "12": {
            "value": "12px"
          },
          "16": {
            "value": "16px"
          },
          "20": {
            "value": "20px"
          },
          "24": {
            "value": "24px"
          },
          "32": {
            "value": "32px"
          },
          "40": {
            "value": "40px"
          },
          "44": {
            "value": "44px"
          },
          "48": {
            "value": "48px"
          },
          "56": {
            "value": "56px"
          },
          "64": {
            "value": "64px"
          },
          "80": {
            "value": "80px"
          },
          "104": {
            "value": "104px"
          },
          "140": {
            "value": "140px"
          },
          "200": {
            "value": "200px"
          }
        }
      },
      "transition": {
        "id": "#tokensConfig/transition",
        "properties": {
          "all": {
            "id": "#tokensConfig/transition/all",
            "properties": {
              "value": {
                "type": "string",
                "id": "#tokensConfig/transition/all/value",
                "default": "all .1s ease-in-out"
              }
            },
            "type": "object",
            "default": {
              "value": "all .1s ease-in-out"
            }
          }
        },
        "type": "object",
        "default": {
          "all": {
            "value": "all .1s ease-in-out"
          }
        }
      }
    },
    "type": "object",
    "default": {
      "media": {
        "sm": {
          "value": "(min-width: 640px)"
        },
        "md": {
          "value": "(min-width: 768px)"
        },
        "lg": {
          "value": "(min-width: 1024px)"
        },
        "xl": {
          "value": "(min-width: 1280px)"
        },
        "xxl": {
          "value": "(min-width: 1536px)"
        }
      },
      "font": {
        "primary": {
          "value": "Inter, sans-serif"
        },
        "secondary": {
          "value": "PaytoneOne, serif"
        }
      },
      "color": {
        "white": {
          "value": "#FFFFFF"
        },
        "black": {
          "value": "#191919"
        },
        "dimmed": {
          "value": "rgba(0, 0, 0, .35)"
        },
        "dark": {
          "value": "rgba(255, 255, 255, .15)"
        },
        "blue": {
          "50": {
            "value": "#C5CDE8"
          },
          "100": {
            "value": "#B6C1E2"
          },
          "200": {
            "value": "#99A8D7"
          },
          "300": {
            "value": "#7B8FCB"
          },
          "400": {
            "value": "#5E77C0"
          },
          "500": {
            "value": "#4560B0"
          },
          "600": {
            "value": "#354A88"
          },
          "700": {
            "value": "#25345F"
          },
          "800": {
            "value": "#161E37"
          },
          "900": {
            "value": "#06080F"
          }
        },
        "red": {
          "50": {
            "value": "#FCDFDA"
          },
          "100": {
            "value": "#FACFC7"
          },
          "200": {
            "value": "#F7AEA2"
          },
          "300": {
            "value": "#F48E7C"
          },
          "400": {
            "value": "#F06D57"
          },
          "500": {
            "value": "#ED4D31"
          },
          "600": {
            "value": "#D32F12"
          },
          "700": {
            "value": "#A0240E"
          },
          "800": {
            "value": "#6C1809"
          },
          "900": {
            "value": "#390D05"
          }
        },
        "green": {
          "50": {
            "value": "#CDF4E5"
          },
          "100": {
            "value": "#BCF0DC"
          },
          "200": {
            "value": "#9AE9CB"
          },
          "300": {
            "value": "#79E2BA"
          },
          "400": {
            "value": "#57DAA8"
          },
          "500": {
            "value": "#36D397"
          },
          "600": {
            "value": "#26AB78"
          },
          "700": {
            "value": "#1B7D58"
          },
          "800": {
            "value": "#114F38"
          },
          "900": {
            "value": "#072117"
          }
        },
        "yellow": {
          "50": {
            "value": "#FFFFFF"
          },
          "100": {
            "value": "#FFFFFF"
          },
          "200": {
            "value": "#FFFFFF"
          },
          "300": {
            "value": "#FFFFFF"
          },
          "400": {
            "value": "#FFFFFF"
          },
          "500": {
            "value": "#FBEFDE"
          },
          "600": {
            "value": "#F5D7AC"
          },
          "700": {
            "value": "#EFBE7A"
          },
          "800": {
            "value": "#E9A648"
          },
          "900": {
            "value": "#DE8D1B"
          }
        },
        "grey": {
          "50": {
            "value": "#F7F7F7"
          },
          "100": {
            "value": "#EBEBEB"
          },
          "200": {
            "value": "#D9D9D9"
          },
          "300": {
            "value": "#C0C0C0"
          },
          "400": {
            "value": "#A8A8A8"
          },
          "500": {
            "value": "#979797"
          },
          "600": {
            "value": "#7E7E7E"
          },
          "700": {
            "value": "#656565"
          },
          "800": {
            "value": "#4D4D4D"
          },
          "900": {
            "value": "#2E2E2E"
          }
        },
        "primary": {
          "100": {
            "value": {
              "initial": "{color.red.100}",
              "dark": "{color.red.900}"
            }
          },
          "200": {
            "value": {
              "initial": "{color.red.200}",
              "dark": "{color.red.800}"
            }
          },
          "300": {
            "value": {
              "initial": "{color.red.300}",
              "dark": "{color.red.700}"
            }
          },
          "400": {
            "value": {
              "initial": "{color.red.400}",
              "dark": "{color.red.600}"
            }
          },
          "500": {
            "value": {
              "initial": "{color.red.500}",
              "dark": "{color.red.500}"
            }
          },
          "600": {
            "value": {
              "initial": "{color.red.600}",
              "dark": "{color.red.400}"
            }
          },
          "700": {
            "value": {
              "initial": "{color.red.700}",
              "dark": "{color.red.300}"
            }
          },
          "800": {
            "value": {
              "initial": "{color.red.800}",
              "dark": "{color.red.200}"
            }
          },
          "900": {
            "value": {
              "initial": "{color.red.900}",
              "dark": "{color.red.100}"
            }
          }
        }
      },
      "shadow": {
        "xs": {
          "value": "0 1px 2px 0 {color.grey.800}"
        },
        "sm": {
          "value": "0 1px 2px -1px {color.grey.800}, 0 1px 3px 0 {color.grey.800}"
        },
        "md": {
          "value": "0 2px 4px -2px {color.grey.800}, 0 4px 6px -1px {color.grey.800}"
        },
        "lg": {
          "value": "0 4px 6px -4px {color.grey.800}, 0 10px 15px -3px {color.grey.800}"
        },
        "xl": {
          "value": "0 8px 10px -6px {color.grey.800}, 0 20px 25px -5px {color.grey.800}"
        },
        "xxl": {
          "value": "0 25px 50px -12px {color.grey.800}"
        }
      },
      "fontWeight": {
        "thin": {
          "value": 100
        },
        "extralight": {
          "value": 200
        },
        "light": {
          "value": 300
        },
        "normal": {
          "value": 400
        },
        "medium": {
          "value": 500
        },
        "semibold": {
          "value": 600
        },
        "bold": {
          "value": 700
        },
        "extrabold": {
          "value": 800
        },
        "black": {
          "value": 900
        }
      },
      "fontSize": {
        "xs": {
          "value": "12px"
        },
        "sm": {
          "value": "14px"
        },
        "md": {
          "value": "16px"
        },
        "lg": {
          "value": "18px"
        },
        "xl": {
          "value": "20px"
        },
        "xxl": {
          "value": "24px"
        },
        "3xl": {
          "value": "30px"
        },
        "4xl": {
          "value": "36px"
        },
        "5xl": {
          "value": "48px"
        },
        "6xl": {
          "value": "60px"
        },
        "7xl": {
          "value": "72px"
        },
        "8xl": {
          "value": "96px"
        },
        "9xl": {
          "value": "128px"
        }
      },
      "letterSpacing": {
        "tighter": {
          "value": "-.05em"
        },
        "tight": {
          "value": "-0025em"
        },
        "normal": {
          "value": "0em"
        },
        "wide": {
          "value": "0025em"
        },
        "wider": {
          "value": ".05em"
        },
        "widest": {
          "value": "0.1em"
        }
      },
      "lead": {
        "none": {
          "value": 1
        },
        "tight": {
          "value": 1.25
        },
        "snug": {
          "value": 1.375
        },
        "normal": {
          "value": 1.5
        },
        "relaxed": {
          "value": 1.625
        },
        "loose": {
          "value": 2
        }
      },
      "radii": {
        "2xs": {
          "value": "0.125rem"
        },
        "xs": {
          "value": "0.25rem"
        },
        "sm": {
          "value": "0.375rem"
        },
        "md": {
          "value": "0.5rem"
        },
        "lg": {
          "value": "1rem"
        },
        "xl": {
          "value": "1rem"
        },
        "xxl": {
          "value": "1.5rem"
        },
        "full": {
          "value": "9999px"
        }
      },
      "size": {
        "4": {
          "value": "4px"
        },
        "6": {
          "value": "6px"
        },
        "8": {
          "value": "8px"
        },
        "12": {
          "value": "12px"
        },
        "16": {
          "value": "16px"
        },
        "20": {
          "value": "20px"
        },
        "24": {
          "value": "24px"
        },
        "32": {
          "value": "32px"
        },
        "40": {
          "value": "40px"
        },
        "48": {
          "value": "48px"
        },
        "56": {
          "value": "56px"
        },
        "64": {
          "value": "64px"
        },
        "80": {
          "value": "80px"
        },
        "104": {
          "value": "104px"
        },
        "200": {
          "value": "200px"
        }
      },
      "space": {
        "0": {
          "value": "0"
        },
        "1": {
          "value": "1px"
        },
        "2": {
          "value": "2px"
        },
        "4": {
          "value": "4px"
        },
        "6": {
          "value": "6px"
        },
        "8": {
          "value": "8px"
        },
        "10": {
          "value": "10px"
        },
        "12": {
          "value": "12px"
        },
        "16": {
          "value": "16px"
        },
        "20": {
          "value": "20px"
        },
        "24": {
          "value": "24px"
        },
        "32": {
          "value": "32px"
        },
        "40": {
          "value": "40px"
        },
        "44": {
          "value": "44px"
        },
        "48": {
          "value": "48px"
        },
        "56": {
          "value": "56px"
        },
        "64": {
          "value": "64px"
        },
        "80": {
          "value": "80px"
        },
        "104": {
          "value": "104px"
        },
        "140": {
          "value": "140px"
        },
        "200": {
          "value": "200px"
        }
      },
      "borderWidth": {
        "noBorder": {
          "value": "0"
        },
        "sm": {
          "value": "1px"
        },
        "md": {
          "value": "2px"
        },
        "lg": {
          "value": "3px"
        }
      },
      "opacity": {
        "noOpacity": {
          "value": "0"
        },
        "bright": {
          "value": "0.1"
        },
        "light": {
          "value": "0.15"
        },
        "soft": {
          "value": "0.3"
        },
        "medium": {
          "value": "0.5"
        },
        "high": {
          "value": "0.8"
        },
        "total": {
          "value": "1"
        }
      },
      "zIndex": {
        "0": {
          "value": "0"
        },
        "1": {
          "value": "1px"
        },
        "2": {
          "value": "2px"
        },
        "4": {
          "value": "4px"
        },
        "6": {
          "value": "6px"
        },
        "8": {
          "value": "8px"
        },
        "10": {
          "value": "10px"
        },
        "12": {
          "value": "12px"
        },
        "16": {
          "value": "16px"
        },
        "20": {
          "value": "20px"
        },
        "24": {
          "value": "24px"
        },
        "32": {
          "value": "32px"
        },
        "40": {
          "value": "40px"
        },
        "44": {
          "value": "44px"
        },
        "48": {
          "value": "48px"
        },
        "56": {
          "value": "56px"
        },
        "64": {
          "value": "64px"
        },
        "80": {
          "value": "80px"
        },
        "104": {
          "value": "104px"
        },
        "140": {
          "value": "140px"
        },
        "200": {
          "value": "200px"
        }
      },
      "transition": {
        "all": {
          "value": "all .1s ease-in-out"
        }
      }
    }
  },
  "default": {
    "media": {
      "sm": {
        "value": "(min-width: 640px)"
      },
      "md": {
        "value": "(min-width: 768px)"
      },
      "lg": {
        "value": "(min-width: 1024px)"
      },
      "xl": {
        "value": "(min-width: 1280px)"
      },
      "xxl": {
        "value": "(min-width: 1536px)"
      }
    },
    "font": {
      "primary": {
        "value": "Inter, sans-serif"
      },
      "secondary": {
        "value": "PaytoneOne, serif"
      }
    },
    "color": {
      "white": {
        "value": "#FFFFFF"
      },
      "black": {
        "value": "#191919"
      },
      "dimmed": {
        "value": "rgba(0, 0, 0, .35)"
      },
      "dark": {
        "value": "rgba(255, 255, 255, .15)"
      },
      "blue": {
        "50": {
          "value": "#C5CDE8"
        },
        "100": {
          "value": "#B6C1E2"
        },
        "200": {
          "value": "#99A8D7"
        },
        "300": {
          "value": "#7B8FCB"
        },
        "400": {
          "value": "#5E77C0"
        },
        "500": {
          "value": "#4560B0"
        },
        "600": {
          "value": "#354A88"
        },
        "700": {
          "value": "#25345F"
        },
        "800": {
          "value": "#161E37"
        },
        "900": {
          "value": "#06080F"
        }
      },
      "red": {
        "50": {
          "value": "#FCDFDA"
        },
        "100": {
          "value": "#FACFC7"
        },
        "200": {
          "value": "#F7AEA2"
        },
        "300": {
          "value": "#F48E7C"
        },
        "400": {
          "value": "#F06D57"
        },
        "500": {
          "value": "#ED4D31"
        },
        "600": {
          "value": "#D32F12"
        },
        "700": {
          "value": "#A0240E"
        },
        "800": {
          "value": "#6C1809"
        },
        "900": {
          "value": "#390D05"
        }
      },
      "green": {
        "50": {
          "value": "#CDF4E5"
        },
        "100": {
          "value": "#BCF0DC"
        },
        "200": {
          "value": "#9AE9CB"
        },
        "300": {
          "value": "#79E2BA"
        },
        "400": {
          "value": "#57DAA8"
        },
        "500": {
          "value": "#36D397"
        },
        "600": {
          "value": "#26AB78"
        },
        "700": {
          "value": "#1B7D58"
        },
        "800": {
          "value": "#114F38"
        },
        "900": {
          "value": "#072117"
        }
      },
      "yellow": {
        "50": {
          "value": "#FFFFFF"
        },
        "100": {
          "value": "#FFFFFF"
        },
        "200": {
          "value": "#FFFFFF"
        },
        "300": {
          "value": "#FFFFFF"
        },
        "400": {
          "value": "#FFFFFF"
        },
        "500": {
          "value": "#FBEFDE"
        },
        "600": {
          "value": "#F5D7AC"
        },
        "700": {
          "value": "#EFBE7A"
        },
        "800": {
          "value": "#E9A648"
        },
        "900": {
          "value": "#DE8D1B"
        }
      },
      "grey": {
        "50": {
          "value": "#F7F7F7"
        },
        "100": {
          "value": "#EBEBEB"
        },
        "200": {
          "value": "#D9D9D9"
        },
        "300": {
          "value": "#C0C0C0"
        },
        "400": {
          "value": "#A8A8A8"
        },
        "500": {
          "value": "#979797"
        },
        "600": {
          "value": "#7E7E7E"
        },
        "700": {
          "value": "#656565"
        },
        "800": {
          "value": "#4D4D4D"
        },
        "900": {
          "value": "#2E2E2E"
        }
      },
      "primary": {
        "100": {
          "value": {
            "initial": "{color.red.100}",
            "dark": "{color.red.900}"
          }
        },
        "200": {
          "value": {
            "initial": "{color.red.200}",
            "dark": "{color.red.800}"
          }
        },
        "300": {
          "value": {
            "initial": "{color.red.300}",
            "dark": "{color.red.700}"
          }
        },
        "400": {
          "value": {
            "initial": "{color.red.400}",
            "dark": "{color.red.600}"
          }
        },
        "500": {
          "value": {
            "initial": "{color.red.500}",
            "dark": "{color.red.500}"
          }
        },
        "600": {
          "value": {
            "initial": "{color.red.600}",
            "dark": "{color.red.400}"
          }
        },
        "700": {
          "value": {
            "initial": "{color.red.700}",
            "dark": "{color.red.300}"
          }
        },
        "800": {
          "value": {
            "initial": "{color.red.800}",
            "dark": "{color.red.200}"
          }
        },
        "900": {
          "value": {
            "initial": "{color.red.900}",
            "dark": "{color.red.100}"
          }
        }
      }
    },
    "shadow": {
      "xs": {
        "value": "0 1px 2px 0 {color.grey.800}"
      },
      "sm": {
        "value": "0 1px 2px -1px {color.grey.800}, 0 1px 3px 0 {color.grey.800}"
      },
      "md": {
        "value": "0 2px 4px -2px {color.grey.800}, 0 4px 6px -1px {color.grey.800}"
      },
      "lg": {
        "value": "0 4px 6px -4px {color.grey.800}, 0 10px 15px -3px {color.grey.800}"
      },
      "xl": {
        "value": "0 8px 10px -6px {color.grey.800}, 0 20px 25px -5px {color.grey.800}"
      },
      "xxl": {
        "value": "0 25px 50px -12px {color.grey.800}"
      }
    },
    "fontWeight": {
      "thin": {
        "value": 100
      },
      "extralight": {
        "value": 200
      },
      "light": {
        "value": 300
      },
      "normal": {
        "value": 400
      },
      "medium": {
        "value": 500
      },
      "semibold": {
        "value": 600
      },
      "bold": {
        "value": 700
      },
      "extrabold": {
        "value": 800
      },
      "black": {
        "value": 900
      }
    },
    "fontSize": {
      "xs": {
        "value": "12px"
      },
      "sm": {
        "value": "14px"
      },
      "md": {
        "value": "16px"
      },
      "lg": {
        "value": "18px"
      },
      "xl": {
        "value": "20px"
      },
      "xxl": {
        "value": "24px"
      },
      "3xl": {
        "value": "30px"
      },
      "4xl": {
        "value": "36px"
      },
      "5xl": {
        "value": "48px"
      },
      "6xl": {
        "value": "60px"
      },
      "7xl": {
        "value": "72px"
      },
      "8xl": {
        "value": "96px"
      },
      "9xl": {
        "value": "128px"
      }
    },
    "letterSpacing": {
      "tighter": {
        "value": "-.05em"
      },
      "tight": {
        "value": "-0025em"
      },
      "normal": {
        "value": "0em"
      },
      "wide": {
        "value": "0025em"
      },
      "wider": {
        "value": ".05em"
      },
      "widest": {
        "value": "0.1em"
      }
    },
    "lead": {
      "none": {
        "value": 1
      },
      "tight": {
        "value": 1.25
      },
      "snug": {
        "value": 1.375
      },
      "normal": {
        "value": 1.5
      },
      "relaxed": {
        "value": 1.625
      },
      "loose": {
        "value": 2
      }
    },
    "radii": {
      "2xs": {
        "value": "0.125rem"
      },
      "xs": {
        "value": "0.25rem"
      },
      "sm": {
        "value": "0.375rem"
      },
      "md": {
        "value": "0.5rem"
      },
      "lg": {
        "value": "1rem"
      },
      "xl": {
        "value": "1rem"
      },
      "xxl": {
        "value": "1.5rem"
      },
      "full": {
        "value": "9999px"
      }
    },
    "size": {
      "4": {
        "value": "4px"
      },
      "6": {
        "value": "6px"
      },
      "8": {
        "value": "8px"
      },
      "12": {
        "value": "12px"
      },
      "16": {
        "value": "16px"
      },
      "20": {
        "value": "20px"
      },
      "24": {
        "value": "24px"
      },
      "32": {
        "value": "32px"
      },
      "40": {
        "value": "40px"
      },
      "48": {
        "value": "48px"
      },
      "56": {
        "value": "56px"
      },
      "64": {
        "value": "64px"
      },
      "80": {
        "value": "80px"
      },
      "104": {
        "value": "104px"
      },
      "200": {
        "value": "200px"
      }
    },
    "space": {
      "0": {
        "value": "0"
      },
      "1": {
        "value": "1px"
      },
      "2": {
        "value": "2px"
      },
      "4": {
        "value": "4px"
      },
      "6": {
        "value": "6px"
      },
      "8": {
        "value": "8px"
      },
      "10": {
        "value": "10px"
      },
      "12": {
        "value": "12px"
      },
      "16": {
        "value": "16px"
      },
      "20": {
        "value": "20px"
      },
      "24": {
        "value": "24px"
      },
      "32": {
        "value": "32px"
      },
      "40": {
        "value": "40px"
      },
      "44": {
        "value": "44px"
      },
      "48": {
        "value": "48px"
      },
      "56": {
        "value": "56px"
      },
      "64": {
        "value": "64px"
      },
      "80": {
        "value": "80px"
      },
      "104": {
        "value": "104px"
      },
      "140": {
        "value": "140px"
      },
      "200": {
        "value": "200px"
      }
    },
    "borderWidth": {
      "noBorder": {
        "value": "0"
      },
      "sm": {
        "value": "1px"
      },
      "md": {
        "value": "2px"
      },
      "lg": {
        "value": "3px"
      }
    },
    "opacity": {
      "noOpacity": {
        "value": "0"
      },
      "bright": {
        "value": "0.1"
      },
      "light": {
        "value": "0.15"
      },
      "soft": {
        "value": "0.3"
      },
      "medium": {
        "value": "0.5"
      },
      "high": {
        "value": "0.8"
      },
      "total": {
        "value": "1"
      }
    },
    "zIndex": {
      "0": {
        "value": "0"
      },
      "1": {
        "value": "1px"
      },
      "2": {
        "value": "2px"
      },
      "4": {
        "value": "4px"
      },
      "6": {
        "value": "6px"
      },
      "8": {
        "value": "8px"
      },
      "10": {
        "value": "10px"
      },
      "12": {
        "value": "12px"
      },
      "16": {
        "value": "16px"
      },
      "20": {
        "value": "20px"
      },
      "24": {
        "value": "24px"
      },
      "32": {
        "value": "32px"
      },
      "40": {
        "value": "40px"
      },
      "44": {
        "value": "44px"
      },
      "48": {
        "value": "48px"
      },
      "56": {
        "value": "56px"
      },
      "64": {
        "value": "64px"
      },
      "80": {
        "value": "80px"
      },
      "104": {
        "value": "104px"
      },
      "140": {
        "value": "140px"
      },
      "200": {
        "value": "200px"
      }
    },
    "transition": {
      "all": {
        "value": "all .1s ease-in-out"
      }
    }
  }
} as const

export const GeneratedPinceauThemeSchema = typeof schema

