import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * CHIP 2.0 Design System Preset
 * Based on Kit UI v9.2 (GOV.CO)
 *
 * Primary: Cobalt Blue #0943B5
 * Informativos: Success #4CAF50, Warning #FBC02D, Danger #F44336, Info #0943B5
 * Fondos: White Smoke #F5F5F5, Solitude #EBF0FA, Corn Silk #FFF8E1
 */

export const ChipPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
    },
    // --- Kit UI v9.2 GOV.CO Palette ---
    cobalt: {
      50: '#E8EDF8',
      100: '#C5D2EE',
      200: '#9EB4E3',
      300: '#7796D8',
      400: '#5A80CF',
      500: '#3D6AC6',
      600: '#1E54B8',
      700: '#0943B5',
      800: '#073899',
      900: '#052D7D',
      950: '#031E54',
    },
    // --- Kit UI v9.2 Grey Scale ---
    grey: {
      50: '#F5F5F5',   // White Smoke (fondos)
      100: '#EBEBEB',
      200: '#D6D6D6',  // Silver
      300: '#BDBDBD',
      400: '#9E9E9E',
      500: '#7A7A7A',  // Grey
      600: '#616161',
      700: '#4C4C4C',  // Matterhorn
      800: '#3B3B3B',
      900: '#2B2B2B',
      950: '#1A1A1A',  // Black
    },
    // --- Kit UI v9.2 Informative Colors ---
    success: {
      50: '#E8F5E9',
      100: '#C8E6C9',
      200: '#A5D6A7',
      300: '#81C784',
      400: '#66BB6A',
      500: '#4CAF50',
      600: '#43A047',
      700: '#388E3C',
      800: '#2E7D32',
      900: '#1B5E20',
      950: '#0D3610',
    },
    warning: {
      50: '#FFFDE7',
      100: '#FFF9C4',
      200: '#FFF59D',
      300: '#FFF176',
      400: '#FFEE58',
      500: '#FFEB3B',
      600: '#FDD835',
      700: '#FBC02D',
      800: '#F9A825',
      900: '#F57F17',
      950: '#E65100',
    },
    danger: {
      50: '#FFEBEE',
      100: '#FFCDD2',
      200: '#EF9A9A',
      300: '#E57373',
      400: '#EF5350',
      500: '#F44336',
      600: '#E53935',
      700: '#D32F2F',
      800: '#C62828',
      900: '#B71C1C',
      950: '#7F0000',
    },
    // --- Kit UI v9.2 Background Colors ---
    solitude: '#EBF0FA',
    cornSilk: '#FFF8E1',
    whiteSmoke: '#F5F5F5',
  },
  semantic: {
    transitionDuration: '0.2s',
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{cobalt.500}',
      offset: '2px',
    },
    disabledOpacity: '0.6',
    iconSize: '1rem',
    anchorGutter: '2px',
    primary: {
      50: '{cobalt.50}',
      100: '{cobalt.100}',
      200: '{cobalt.200}',
      300: '{cobalt.300}',
      400: '{cobalt.400}',
      500: '{cobalt.500}',
      600: '{cobalt.600}',
      700: '{cobalt.700}',
      800: '{cobalt.800}',
      900: '{cobalt.900}',
      950: '{cobalt.950}',
    },
    formField: {
      paddingX: '0.625rem',
      paddingY: '0.375rem',
      sm: {
        fontSize: '0.875rem',
        paddingX: '0.5rem',
        paddingY: '0.25rem',
      },
      lg: {
        fontSize: '1.125rem',
        paddingX: '0.875rem',
        paddingY: '0.5rem',
      },
      borderRadius: '{borderRadius.md}',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: '0 0 0 2px {cobalt.200}',
      },
      transitionDuration: '{transitionDuration}',
    },
    list: {
      padding: '0.25rem 0.25rem',
      gap: '2px',
      header: {
        padding: '0.625rem 1rem 0.375rem 1rem',
      },
      option: {
        padding: '0.625rem 0.75rem',
        borderRadius: '{borderRadius.sm}',
        fontSize: '15px',
      },
      optionGroup: {
        padding: '0.625rem 1rem',
        fontWeight: '600',
        fontSize: '15px',
      },
    },
    content: {
      borderRadius: '{borderRadius.md}',
    },
    mask: {
      transitionDuration: '0.15s',
    },
    navigation: {
      list: {
        padding: '0.25rem 0.25rem',
        gap: '2px',
      },
      item: {
        padding: '0.625rem 0.75rem',
        borderRadius: '{borderRadius.sm}',
        gap: '0.5rem',
        fontSize: '14px',
      },
      submenuLabel: {
        padding: '0.625rem 1rem',
        fontWeight: '700',
        fontSize: '14px',
      },
      submenuIcon: {
        size: '0.875rem',
      },
    },
    overlay: {
      select: {
        borderRadius: '{borderRadius.md}',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      popover: {
        borderRadius: '{borderRadius.md}',
        padding: '0.75rem',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      modal: {
        borderRadius: '{borderRadius.lg}',
        padding: '1.5rem',
        shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
      navigation: {
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{grey.50}',
          100: '{grey.100}',
          200: '{grey.200}',
          300: '{grey.300}',
          400: '{grey.400}',
          500: '{grey.500}',
          600: '{grey.600}',
          700: '{grey.700}',
          800: '{grey.800}',
          900: '{grey.900}',
          950: '{grey.950}',
        },
        primary: {
          color: '{cobalt.700}',
          contrastColor: '#ffffff',
          hoverColor: '{cobalt.800}',
          activeColor: '{cobalt.900}',
        },
        highlight: {
          background: '{cobalt.50}',
          focusBackground: '{cobalt.100}',
          color: '{cobalt.700}',
          focusColor: '{cobalt.800}',
        },
        mask: {
          background: 'rgba(0, 0, 0, 0.4)',
          color: '{surface.200}',
        },
        formField: {
          background: '{surface.0}',
          disabledBackground: '{surface.50}',
          filledBackground: '{surface.50}',
          filledHoverBackground: '{surface.50}',
          filledFocusBackground: '{surface.50}',
          borderColor: '{surface.300}',
          hoverBorderColor: '{cobalt.400}',
          focusBorderColor: '{cobalt.600}',
          invalidBorderColor: '{danger.500}',
          color: '{surface.800}',
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          invalidPlaceholderColor: '{danger.500}',
          floatLabelColor: '{surface.500}',
          floatLabelFocusColor: '{cobalt.600}',
          floatLabelActiveColor: '{surface.500}',
          floatLabelInvalidColor: '{danger.500}',
          iconColor: '{surface.500}',
          shadow: 'none',
        },
        text: {
          color: '{surface.800}',
          hoverColor: '{surface.900}',
          mutedColor: '{surface.500}',
          hoverMutedColor: '{surface.600}',
        },
        content: {
          background: '{surface.0}',
          hoverBackground: '{surface.50}',
          borderColor: '{surface.200}',
          color: '{text.color}',
          hoverColor: '{text.hoverColor}',
        },
        overlay: {
          select: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
          popover: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
          modal: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
        },
        list: {
          option: {
            focusBackground: '{cobalt.50}',
            selectedBackground: '{cobalt.50}',
            selectedFocusBackground: '{cobalt.100}',
            color: '{text.color}',
            focusColor: '{text.hoverColor}',
            selectedColor: '{cobalt.700}',
            selectedFocusColor: '{cobalt.800}',
            icon: {
              color: '{surface.400}',
              focusColor: '{surface.500}',
            },
          },
          optionGroup: {
            background: 'transparent',
            color: '{text.mutedColor}',
          },
        },
        navigation: {
          item: {
            focusBackground: '{cobalt.50}',
            activeBackground: '{cobalt.50}',
            color: '{text.color}',
            focusColor: '{cobalt.700}',
            activeColor: '{cobalt.700}',
            icon: {
              color: '{surface.400}',
              focusColor: '{cobalt.700}',
              activeColor: '{cobalt.700}',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color: '{text.mutedColor}',
          },
          submenuIcon: {
            color: '{surface.400}',
            focusColor: '{text.color}',
            activeColor: '{text.color}',
          },
        },
      },
      dark: {
        surface: {
          0: '#1a1a2e',
          50: '#1e1e32',
          100: '#252540',
          200: '#2d2d4e',
          300: '#3a3a5c',
          400: '#4a4a6a',
          500: '#6b6b8a',
          600: '#8c8ca8',
          700: '#acacc2',
          800: '#ccccdb',
          900: '#e5e5ee',
          950: '#f5f5f8',
        },
        primary: {
          color: '{cobalt.300}',
          contrastColor: '{surface.950}',
          hoverColor: '{cobalt.200}',
          activeColor: '{cobalt.100}',
        },
        highlight: {
          background: 'color-mix(in srgb, {cobalt.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {cobalt.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
        mask: {
          background: 'rgba(0, 0, 0, 0.6)',
          color: '{surface.200}',
        },
        formField: {
          background: '{surface.50}',
          disabledBackground: '{surface.100}',
          filledBackground: '{surface.100}',
          filledHoverBackground: '{surface.100}',
          filledFocusBackground: '{surface.100}',
          borderColor: '{surface.300}',
          hoverBorderColor: '{surface.400}',
          focusBorderColor: '{cobalt.400}',
          invalidBorderColor: '{danger.400}',
          color: '{surface.900}',
          disabledColor: '{surface.500}',
          placeholderColor: '{surface.500}',
          invalidPlaceholderColor: '{danger.400}',
          floatLabelColor: '{surface.500}',
          floatLabelFocusColor: '{cobalt.400}',
          floatLabelActiveColor: '{surface.500}',
          floatLabelInvalidColor: '{danger.400}',
          iconColor: '{surface.500}',
          shadow: 'none',
        },
        text: {
          color: '{surface.900}',
          hoverColor: '{surface.950}',
          mutedColor: '{surface.500}',
          hoverMutedColor: '{surface.600}',
        },
        content: {
          background: '{surface.50}',
          hoverBackground: '{surface.100}',
          borderColor: '{surface.200}',
          color: '{text.color}',
          hoverColor: '{text.hoverColor}',
        },
        overlay: {
          select: {
            background: '{surface.50}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
          popover: {
            background: '{surface.50}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
          modal: {
            background: '{surface.50}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
        },
        list: {
          option: {
            focusBackground: '{surface.100}',
            selectedBackground: '{surface.100}',
            selectedFocusBackground: '{surface.200}',
            color: '{text.color}',
            focusColor: '{text.hoverColor}',
            selectedColor: '{cobalt.300}',
            selectedFocusColor: '{cobalt.200}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
            },
          },
          optionGroup: {
            background: 'transparent',
            color: '{text.mutedColor}',
          },
        },
        navigation: {
          item: {
            focusBackground: '{surface.100}',
            activeBackground: '{surface.100}',
            color: '{text.color}',
            focusColor: '{text.hoverColor}',
            activeColor: '{text.hoverColor}',
            icon: {
              color: '{surface.500}',
              focusColor: '{text.hoverColor}',
              activeColor: '{text.hoverColor}',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color: '{text.mutedColor}',
          },
          submenuIcon: {
            color: '{surface.500}',
            focusColor: '{text.color}',
            activeColor: '{text.color}',
          },
        },
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            primary: {
              background: '{cobalt.700}',
              hoverBackground: '{cobalt.800}',
              activeBackground: '{cobalt.900}',
              borderColor: '{cobalt.700}',
              hoverBorderColor: '{cobalt.800}',
              activeBorderColor: '{cobalt.900}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
              focusRing: {
                color: '{cobalt.700}',
                shadow: 'none',
              },
            },
            secondary: {
              background: '{surface.100}',
              hoverBackground: '{surface.200}',
              activeBackground: '{surface.300}',
              borderColor: '{surface.100}',
              hoverBorderColor: '{surface.200}',
              activeBorderColor: '{surface.300}',
              color: '{surface.700}',
              hoverColor: '{surface.800}',
              activeColor: '{surface.900}',
              focusRing: {
                color: '{surface.500}',
                shadow: 'none',
              },
            },
            success: {
              background: '{success.500}',
              hoverBackground: '{success.600}',
              activeBackground: '{success.700}',
              borderColor: '{success.500}',
              hoverBorderColor: '{success.600}',
              activeBorderColor: '{success.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
              focusRing: {
                color: '{success.500}',
                shadow: 'none',
              },
            },
            warn: {
              background: '{warning.800}',
              hoverBackground: '{warning.900}',
              activeBackground: '{warning.950}',
              borderColor: '{warning.800}',
              hoverBorderColor: '{warning.900}',
              activeBorderColor: '{warning.950}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
              focusRing: {
                color: '{warning.800}',
                shadow: 'none',
              },
            },
            danger: {
              background: '{danger.500}',
              hoverBackground: '{danger.600}',
              activeBackground: '{danger.700}',
              borderColor: '{danger.500}',
              hoverBorderColor: '{danger.600}',
              activeBorderColor: '{danger.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
              focusRing: {
                color: '{danger.500}',
                shadow: 'none',
              },
            },
          },
          outlined: {
            primary: {
              hoverBackground: '{cobalt.50}',
              activeBackground: '{cobalt.100}',
              borderColor: '{cobalt.600}',
              color: '{cobalt.700}',
            },
            success: {
              hoverBackground: '{success.50}',
              activeBackground: '{success.100}',
              borderColor: '{success.500}',
              color: '{success.600}',
            },
            warn: {
              hoverBackground: '{warning.50}',
              activeBackground: '{warning.100}',
              borderColor: '{warning.800}',
              color: '{warning.900}',
            },
          },
          text: {
            primary: {
              hoverBackground: '{cobalt.50}',
              activeBackground: '{cobalt.100}',
              color: '{cobalt.700}',
            },
            success: {
              hoverBackground: '{success.50}',
              activeBackground: '{success.100}',
              color: '{success.600}',
            },
            warn: {
              hoverBackground: '{warning.50}',
              activeBackground: '{warning.100}',
              color: '{warning.900}',
            },
          },
        },
      },
    },
    tag: {
      colorScheme: {
        light: {
          success: {
            background: '{success.50}',
            color: '{success.700}',
          },
          warn: {
            background: '{warning.50}',
            color: '{warning.900}',
          },
          danger: {
            background: '{danger.50}',
            color: '{danger.700}',
          },
          info: {
            background: '{cobalt.50}',
            color: '{cobalt.700}',
          },
          secondary: {
            background: '{surface.100}',
            color: '{surface.600}',
          },
        },
      },
    },
    badge: {
      colorScheme: {
        light: {
          primary: {
            background: '{cobalt.700}',
            color: '#ffffff',
          },
          success: {
            background: '{success.500}',
            color: '#ffffff',
          },
          warn: {
            background: '{warning.800}',
            color: '#ffffff',
          },
          danger: {
            background: '{danger.500}',
            color: '#ffffff',
          },
          info: {
            background: '{cobalt.700}',
            color: '#ffffff',
          },
        },
      },
    },
  },
});
