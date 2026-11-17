import { createContext } from 'react';

/** Keep nested sheets and pickers inside their native modal's top layer. */
export const OverlayContainerContext = createContext<HTMLElement | null>(null);
