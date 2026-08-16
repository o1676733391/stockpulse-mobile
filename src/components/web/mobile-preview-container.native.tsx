import React from 'react';

/**
 * On native iOS/Android platforms, this is a zero-overhead passthrough.
 * Real mobile devices always render full native views with system safe areas.
 */
export function MobilePreviewContainer({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
