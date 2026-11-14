// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<Extract<SymbolViewProps['name'], string>, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'link': 'link',
  'waveform.badge.magnifyingglass': 'analytics',
  'house': 'home',
  'nosign': 'do-not-disturb-on',
  'flag': 'flag',
  'arrow.left.square': 'arrow-left',
  'checkmark': 'check',
  'doc.on.doc': 'content-copy',
  'person.fill': 'person',
  'clock': 'access-time',
  'chevron.down': 'keyboard-arrow-down',
  'x.circle': 'close',
  'hourglass': 'hourglass-bottom',
  'exclamationmark.triangle': 'error',
  'checkmark.circle': 'check-circle',
  'person.2': 'person',
  'person.crop.circle.badge.exclamationmark': 'person',
  'arrow.counterclockwise': 'arrow-back',
  'hand.raised': 'waving-hand',
  'chevron.left.to.line': 'first-page',
  'chevron.right.to.line': 'last-page',
  'chevron.left': 'navigate-before',
  'chevron.right': 'navigate-next',
  'line.3.horizontal': 'menu',
  'eye': 'visibility',
  'trophy': 'emoji-events',
  'gearshape': 'settings',
  'person.2.fill': 'group',
  'bolt.fill': 'bolt',
  'xmark': 'close',
  'lock.fill': 'lock',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
