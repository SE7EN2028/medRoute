import React from 'react';
import Svg, { Path, Circle, Rect, G, Ellipse } from 'react-native-svg';

export type IconName =
  | 'home' | 'compass' | 'droplet' | 'user' | 'mic'
  | 'arrow-right' | 'arrow-up' | 'arrow-left' | 'chevron-r'
  | 'phone' | 'phone-fill' | 'pin' | 'navigate' | 'share'
  | 'heart' | 'heart-pulse' | 'shield' | 'shield-plus' | 'alert' | 'info'
  | 'check' | 'check-c' | 'x' | 'plus' | 'minus'
  | 'star' | 'clock' | 'calendar' | 'filter' | 'sliders' | 'map' | 'list'
  | 'lock' | 'sparkle' | 'sparkles' | 'wave' | 'whatsapp' | 'message' | 'flame'
  | 'pill' | 'thermometer' | 'bandage' | 'water' | 'sun' | 'leaf'
  | 'wifi-off' | 'volume' | 'paper-plane' | 'settings' | 'history'
  | 'bell' | 'edit' | 'eye' | 'eye-off' | 'logo';

interface Props {
  name: IconName;
  size?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, stroke = '#1A1A17', fill = 'none', strokeWidth = 1.6 }: Props) {
  const p = { width: size, height: size, viewBox: '0 0 24 24' } as const;
  const sp = { stroke, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };

  switch (name) {
    case 'home':
      return (
        <Svg {...p}>
          <Path {...sp} d="M3 11.5 12 4l9 7.5" />
          <Path {...sp} d="M5 10v10h14V10" />
        </Svg>
      );
    case 'compass':
      return (
        <Svg {...p}>
          <Circle {...sp} cx={12} cy={12} r={9} />
          <Path {...sp} d="m15.5 8.5-2 5-5 2 2-5z" />
        </Svg>
      );
    case 'droplet':
      return <Svg {...p}><Path {...sp} d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11z" /></Svg>;
    case 'user':
      return (
        <Svg {...p}>
          <Circle {...sp} cx={12} cy={8} r={4} />
          <Path {...sp} d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7" />
        </Svg>
      );
    case 'mic':
      return (
        <Svg {...p}>
          <Rect {...sp} x={9} y={3} width={6} height={12} rx={3} />
          <Path {...sp} d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </Svg>
      );
    case 'arrow-right':
      return <Svg {...p}><Path {...sp} d="M5 12h14m-5-5 5 5-5 5" /></Svg>;
    case 'arrow-up':
      return <Svg {...p}><Path {...sp} d="M12 19V5m-6 6 6-6 6 6" /></Svg>;
    case 'arrow-left':
      return <Svg {...p}><Path {...sp} d="M19 12H5m6 5-6-5 6-5" /></Svg>;
    case 'chevron-r':
      return <Svg {...p}><Path {...sp} d="m9 6 6 6-6 6" /></Svg>;
    case 'phone':
      return <Svg {...p}><Path {...sp} d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg>;
    case 'phone-fill':
      return <Svg {...p}><Path fill={stroke} d="M5 3h3.5a1 1 0 0 1 .95.68l1.4 4.2a1 1 0 0 1-.27 1.06l-1.9 1.6a12 12 0 0 0 4.78 4.78l1.6-1.9a1 1 0 0 1 1.06-.27l4.2 1.4a1 1 0 0 1 .68.95V19a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" /></Svg>;
    case 'pin':
      return (
        <Svg {...p}>
          <Path {...sp} d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" />
          <Circle {...sp} cx={12} cy={10} r={2.5} />
        </Svg>
      );
    case 'navigate':
      return <Svg {...p}><Path {...sp} d="M3 11 21 3l-8 18-2-8z" /></Svg>;
    case 'share':
      return (
        <Svg {...p}>
          <Circle {...sp} cx={6} cy={12} r={2.5} />
          <Circle {...sp} cx={18} cy={6} r={2.5} />
          <Circle {...sp} cx={18} cy={18} r={2.5} />
          <Path {...sp} d="m8 11 8-4M8 13l8 4" />
        </Svg>
      );
    case 'heart':
      return <Svg {...p}><Path {...sp} d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></Svg>;
    case 'heart-pulse':
      return (
        <Svg {...p}>
          <Path {...sp} d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
          <Path {...sp} d="M3 12h4l1.5-3 2 6 1.5-3h2" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...p}>
          <Path {...sp} d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3z" />
          <Path {...sp} d="m9 12 2 2 4-4" />
        </Svg>
      );
    case 'shield-plus':
      return (
        <Svg {...p}>
          <Path {...sp} d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3z" />
          <Path {...sp} d="M12 9v6m-3-3h6" />
        </Svg>
      );
    case 'alert':
      return (
        <Svg {...p}>
          <Path {...sp} d="M12 3 2 21h20L12 3z" />
          <Path {...sp} d="M12 10v5m0 3v.01" />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...p}>
          <Circle {...sp} cx={12} cy={12} r={9} />
          <Path {...sp} d="M12 8v.01M12 11v6" />
        </Svg>
      );
    case 'check':
      return <Svg {...p}><Path {...sp} strokeWidth={strokeWidth + 0.4} d="m5 12 5 5L20 7" /></Svg>;
    case 'check-c':
      return (
        <Svg {...p}>
          <Circle {...sp} cx={12} cy={12} r={9} />
          <Path {...sp} d="m8 12 3 3 5-6" />
        </Svg>
      );
    case 'x':
      return <Svg {...p}><Path {...sp} d="M6 6l12 12M18 6 6 18" /></Svg>;
    case 'plus':
      return <Svg {...p}><Path {...sp} d="M12 5v14M5 12h14" /></Svg>;
    case 'minus':
      return <Svg {...p}><Path {...sp} d="M5 12h14" /></Svg>;
    case 'star':
      return <Svg {...p}><Path fill={stroke} d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.9 6.7 19.7l1.1-6.1L3.3 9.4l6.1-.8z" /></Svg>;
    case 'clock':
      return (
        <Svg {...p}>
          <Circle {...sp} cx={12} cy={12} r={9} />
          <Path {...sp} d="M12 7v5l3 2" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...p}>
          <Rect {...sp} x={3} y={5} width={18} height={16} rx={2} />
          <Path {...sp} d="M3 10h18M8 3v4m8-4v4" />
        </Svg>
      );
    case 'filter':
      return <Svg {...p}><Path {...sp} d="M4 5h16l-6 8v5l-4 2v-7L4 5z" /></Svg>;
    case 'sliders':
      return (
        <Svg {...p}>
          <Path {...sp} d="M4 7h12m4 0h0M4 12h4m4 0h8M4 17h12m4 0h0" />
          <Circle {...sp} cx={18} cy={7} r={2} />
          <Circle {...sp} cx={10} cy={12} r={2} />
          <Circle {...sp} cx={18} cy={17} r={2} />
        </Svg>
      );
    case 'map':
      return (
        <Svg {...p}>
          <Path {...sp} d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
          <Path {...sp} d="M9 4v16M15 6v16" />
        </Svg>
      );
    case 'list':
      return (
        <Svg {...p}>
          <Path {...sp} d="M8 6h12M8 12h12M8 18h12" />
          <Circle cx={4} cy={6} r={1} fill={stroke} />
          <Circle cx={4} cy={12} r={1} fill={stroke} />
          <Circle cx={4} cy={18} r={1} fill={stroke} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...p}>
          <Rect {...sp} x={4} y={11} width={16} height={10} rx={2} />
          <Path {...sp} d="M8 11V8a4 4 0 0 1 8 0v3" />
        </Svg>
      );
    case 'sparkle':
      return <Svg {...p}><Path {...sp} d="M12 3v4M12 17v4M3 12h4m10 0h4m-4-7-3 3m-6 6-3 3m12 0-3-3m-6-6-3-3" /></Svg>;
    case 'sparkles':
      return (
        <Svg {...p}>
          <Path {...sp} d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
          <Path {...sp} d="m19 14 .7 1.9L21.5 16l-1.8.6L19 18l-.7-1.4-1.8-.6 1.8-.7L19 14z" />
        </Svg>
      );
    case 'wave':
      return <Svg {...p}><Path {...sp} d="M3 12c2 0 2-3 4-3s2 6 4 6 2-9 4-9 2 6 4 6 2-3 2-3" /></Svg>;
    case 'whatsapp':
      return (
        <Svg {...p}>
          <Path {...sp} d="M3 21l2-6a8 8 0 1 1 4 4l-6 2z" />
          <Path {...sp} d="M9 10c0 4 3 7 7 7l1-2-2-1-1 1c-1 0-3-2-3-3l1-1-1-2z" />
        </Svg>
      );
    case 'message':
      return <Svg {...p}><Path {...sp} d="M4 5h16v12H8l-4 4V5z" /></Svg>;
    case 'flame':
      return <Svg {...p}><Path {...sp} d="M12 3c0 3 4 4 4 9a4 4 0 0 1-8 0c0-2 2-3 2-5s-1-3-1-3 3 0 3-1z" /></Svg>;
    case 'pill':
      return (
        <Svg {...p}>
          <G transform="rotate(-30 12 12)">
            <Rect {...sp} x={3} y={9} width={18} height={6} rx={3} />
            <Path {...sp} d="m9 9 6 6" />
          </G>
        </Svg>
      );
    case 'thermometer':
      return (
        <Svg {...p}>
          <Path {...sp} d="M14 14V5a2 2 0 1 0-4 0v9a4 4 0 1 0 4 0z" />
          <Circle cx={12} cy={17} r={1.5} fill={stroke} />
        </Svg>
      );
    case 'bandage':
      return (
        <Svg {...p}>
          <G transform="rotate(-30 12 12)">
            <Rect {...sp} x={3} y={9} width={18} height={6} rx={3} />
          </G>
          <Circle cx={10.5} cy={10.5} r={0.6} fill={stroke} />
          <Circle cx={13.5} cy={13.5} r={0.6} fill={stroke} />
        </Svg>
      );
    case 'water':
      return <Svg {...p}><Path {...sp} d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z" /></Svg>;
    case 'sun':
      return (
        <Svg {...p}>
          <Circle {...sp} cx={12} cy={12} r={4} />
          <Path {...sp} d="M12 3v2m0 14v2M3 12h2m14 0h2m-2.5-6.5-1.5 1.5M6 18l-1.5 1.5M18 18l1.5 1.5M6 6 4.5 4.5" />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg {...p}>
          <Path {...sp} d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" />
          <Path {...sp} d="M5 19 12 12" />
        </Svg>
      );
    case 'wifi-off':
      return <Svg {...p}><Path {...sp} d="M3 9a16 16 0 0 1 4-2m4-1a16 16 0 0 1 10 3m-3 4a10 10 0 0 0-5-2m-4 1a10 10 0 0 0-3 1m6 4a4 4 0 0 1 4 0m-2 4v.01M3 3l18 18" /></Svg>;
    case 'volume':
      return (
        <Svg {...p}>
          <Path {...sp} d="M4 9v6h4l5 5V4L8 9H4z" />
          <Path {...sp} d="M17 8a5 5 0 0 1 0 8m3-11a8 8 0 0 1 0 14" />
        </Svg>
      );
    case 'paper-plane':
      return (
        <Svg {...p}>
          <Path {...sp} d="M21 4 3 11l7 2 2 7 9-16z" />
          <Path {...sp} d="m10 13 6-6" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...p}>
          <Circle {...sp} cx={12} cy={12} r={3} />
          <Path {...sp} d="M19.4 15a1.5 1.5 0 0 0 .3 1.6l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.5 1.5 0 0 0-1.6-.3 1.5 1.5 0 0 0-.9 1.4V21a2 2 0 1 1-4 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.6.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.5 1.5 0 0 0 .3-1.6 1.5 1.5 0 0 0-1.4-.9H3a2 2 0 1 1 0-4h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.5 1.5 0 0 0 1.6.3H9a1.5 1.5 0 0 0 .9-1.4V3a2 2 0 1 1 4 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.6-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.5 1.5 0 0 0-.3 1.6V9a1.5 1.5 0 0 0 1.4.9H21a2 2 0 1 1 0 4h-.1a1.5 1.5 0 0 0-1.4.9z" />
        </Svg>
      );
    case 'history':
      return (
        <Svg {...p}>
          <Path {...sp} d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <Path {...sp} d="M3 3v5h5M12 7v5l3 2" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...p}>
          <Path {...sp} d="M6 19h12l-2-3v-5a4 4 0 0 0-8 0v5l-2 3z" />
          <Path {...sp} d="M10 21a2 2 0 0 0 4 0" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg {...p}>
          <Path {...sp} d="M4 20h4l11-11-4-4L4 16v4z" />
          <Path {...sp} d="m13 6 4 4" />
        </Svg>
      );
    case 'eye':
      return (
        <Svg {...p}>
          <Path {...sp} d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <Circle {...sp} cx={12} cy={12} r={3} />
        </Svg>
      );
    case 'eye-off':
      return (
        <Svg {...p}>
          <Path {...sp} d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a16 16 0 0 1-3.5 4M6 6S2 9 2 12a16 16 0 0 0 3 4m4 2a10 10 0 0 0 3 .4" />
          <Path {...sp} d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
        </Svg>
      );
    case 'logo':
      return (
        <Svg {...p}>
          <Path stroke={stroke} strokeWidth={1.5} fill="none" d="M12 3 4 7v6c0 5 3.5 8 8 8s8-3 8-8V7l-8-4z" />
          <Path stroke={stroke} strokeWidth={1.5} strokeLinecap="round" fill="none" d="M12 9v6m-3-3h6" />
        </Svg>
      );
    default:
      return <Svg {...p}><Circle {...sp} cx={12} cy={12} r={9} /></Svg>;
  }
}
