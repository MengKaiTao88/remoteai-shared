import { uiText } from "../localization/uiText";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { Content } from "./types";
import { MessageImage } from "./MessageImage";
import styles from "./MessageEditor.module.less";

export function MessageEditorImages({ images, removed, disabled, onRemove, renderImage }: {
  images: Content[]; removed: number[]; disabled: boolean; onRemove: (index: number) => void;
  renderImage?: (image: Content, index: number) => ReactNode;
}) {
  if (images.every((_, index) => removed.includes(index))) return null;
  return <div className={styles.editorImages}>
    {images.map((image, index) => removed.includes(index) ? null : <div className={styles.editorImage} key={index}>
      {image.url || image.path ? (renderImage?.(image, index) ?? <MessageImage src={image.url || image.path}
        alt={uiText("client.conversation.imageAttachment", { value1: index + 1 })} />)
        : <span role="status">{uiText("client.conversation.loadingImage")}</span>}
      <button type="button" className={styles.removeImage}
        aria-label={uiText("client.chat.removeImage", { value1: index + 1 })}
        disabled={disabled} onClick={() => onRemove(index)}><X size={14} /></button>
    </div>)}
  </div>;
}
