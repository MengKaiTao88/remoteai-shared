import { useRef, type MouseEventHandler, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageNavigation } from './ImageGallery';
import { useImageNavigationKeys } from './useImageNavigationKeys';
import { defaultText } from '../localization/messages';
import { IMAGE_ZOOM_FACTOR, useImageGestures } from './useImageGestures';
import { useImageBackdropDismiss } from './useImageBackdropDismiss';
import './imageViewer.css';

interface Props {
  src: string;
  description: string;
  close: () => void;
  onEscape?: () => void;
  translate?: (text: string) => string;
  naturalSize?: boolean;
  onError?: () => void;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
  renderStage?: (stage: ReactNode) => ReactNode;
  renderToolbar?: (controls: ReactNode) => ReactNode;
  children?: ReactNode;
  navigation?: ImageNavigation;
}

/** Shared fullscreen preview chrome, independent of image loading, downloads and editing. */
export function ImageViewerFrame({ src, description, close, onEscape, translate = defaultText, naturalSize = false,
  onError, onContextMenu, renderStage, renderToolbar, children, navigation }: Props) {
  const gestures = useImageGestures();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useImageNavigationKeys(dialogRef, navigation);
  const backdrop = useImageBackdropDismiss(gestures.stageRef, close);
  const stage = <div className={`cs-image-stage${naturalSize ? ' cs-image-stage-natural' : ''}`}
    ref={gestures.stageRef} {...gestures.stageProps} {...backdrop} onDragStart={event => event.preventDefault()}
    onContextMenu={onContextMenu}>
    <img src={src} alt={description} draggable={false} referrerPolicy="no-referrer"
      onError={onError} ref={gestures.imageRef} />
  </div>;
  const controls = <div className="cs-image-toolbar">
    <button type="button" aria-label={translate('client.shared.zoomOut')}
      onClick={() => gestures.zoom(1 / IMAGE_ZOOM_FACTOR)}>−</button>
    <button type="button" aria-label={translate('client.shared.resetZoom')} onClick={gestures.reset}>
      {Math.round(gestures.scale * 100)}%</button>
    <button type="button" aria-label={translate('client.shared.zoomIn')}
      onClick={() => gestures.zoom(IMAGE_ZOOM_FACTOR)}>+</button>
    <button type="button" aria-label={translate('client.shared.rotateImage')} onClick={gestures.rotate}>↻</button>
  </div>;
  return <dialog ref={(dialog) => {
    dialogRef.current = dialog;
    if (dialog && !dialog.open) dialog.showModal();
  }}
    className="cs-image-viewer" aria-modal="true" aria-label={description} onCancel={close}
    onKeyDownCapture={event => {
      if (event.key !== 'Escape' || !onEscape) return;
      event.preventDefault(); event.stopPropagation(); onEscape();
    }}
    onWheel={event => event.stopPropagation()}>
    {renderStage ? renderStage(stage) : stage}
    {navigation && <>
      <button type="button" className="cs-image-navigation cs-image-previous" disabled={!navigation.previous}
        aria-label={translate('client.projectBrowser.previous')} aria-keyshortcuts="ArrowLeft"
        title={`${translate('client.projectBrowser.previous')} (←)`} onClick={navigation.previous}>
        <ChevronLeft size={28} aria-hidden="true" /></button>
      <button type="button" className="cs-image-navigation cs-image-next" disabled={!navigation.next}
        aria-label={translate('client.projectBrowser.next')} aria-keyshortcuts="ArrowRight"
        title={`${translate('client.projectBrowser.next')} (→)`} onClick={navigation.next}>
        <ChevronRight size={28} aria-hidden="true" /></button>
    </>}
    <button type="button" className="cs-image-close" aria-label={translate('client.shared.closeImage')}
      onClick={close}>×</button>
    {renderToolbar ? renderToolbar(controls) : controls}
    {children}
  </dialog>;
}
