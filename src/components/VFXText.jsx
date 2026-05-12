import { VFXProvider, VFXSpan } from 'react-vfx';

export function VFXWrapper({ children }) {
  return <VFXProvider>{children}</VFXProvider>;
}

export function GlitchText({ children, className = '' }) {
  return (
    <VFXSpan
      shader="glitch"
      className={className}
      style={{ display: 'inline' }}
    >
      {children}
    </VFXSpan>
  );
}

export function RGBShiftText({ children, className = '' }) {
  return (
    <VFXSpan
      shader="rgbShift"
      className={className}
      style={{ display: 'inline' }}
    >
      {children}
    </VFXSpan>
  );
}
