import { useEffect, useRef, useState } from 'react';
import { IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES, readImage, type DraftImage } from '../chat/draftImages';
import { useFileDrop } from '../chat/useFileDrop';
import { useComposerPaste } from '../remote-chat/views/useComposerPaste';
import { pickChatImages } from '../remote-chat/views/pickChatImages';
import { MAX_CHAT_IMAGE_CHARS, validateChatImages } from '../remote-chat/attachments';
import { uiText } from '../localization/uiText';
import type { NativeFileDrop } from '../remote-chat/views/composerProps';
import type { CliController } from './controller';

export interface CliImageInput {
  readClipboardImages?: () => Promise<File[]>;
  nativeFileDrop?: NativeFileDrop;
}

export function useCliImages(options: CliImageInput & {
  controller: CliController; scope: string; active: boolean; disabled: boolean; local: boolean;
}) {
  const { controller, scope, active, disabled, local } = options;
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const latest = useRef(options);
  latest.current = options;
  const pending = useRef(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setError(''); }, [scope]);
  const current = () => latest.current.scope === scope && latest.current.active && !latest.current.disabled;
  const validate = (images: DraftImage[]) => validateChatImages(images.map(image => image.url ?? ''), 'relay');
  const addFiles = async (files: File[]) => {
    if (!current() || pending.current) return;
    pending.current = true; setReading(true); setError('');
    try {
      const previous = controller.getSnapshot().images;
      if (files.length + previous.length > MAX_IMAGES) {
        throw new Error(uiText('client.chat.youCanAddUpToImagesAtATime', { value1: MAX_IMAGES }));
      }
      let additions = local ? await Promise.all(files.map(async file => {
        if (!IMAGE_TYPES.includes(file.type) || !file.size || file.size > MAX_IMAGE_BYTES) {
          throw new Error(uiText('client.chat.chooseAValidImage'));
        }
        return { id: crypto.randomUUID(), name: file.name, url: await readImage(file) };
      })) : (await pickChatImages(files, MAX_IMAGES - previous.length))
        .map((image, index) => ({ ...image, name: files[index].name }));
      // CLI RPC shares the bounded control channel. Retain originals when they fit, otherwise
      // use the same image compression as the remote Codex composer before submitting.
      if ([...previous, ...additions].reduce((size, image) => size + (image.url?.length ?? 0), 0)
        > MAX_CHAT_IMAGE_CHARS) {
        additions = (await pickChatImages(files, MAX_IMAGES - previous.length, 'relay'))
          .map((image, index) => ({ ...image, name: files[index].name }));
      }
      if (!current()) return;
      const images = [...controller.getSnapshot().images, ...additions];
      validate(images); controller.editImages(images);
    } catch (reason) { if (current()) setError(reason instanceof Error ? reason.message :
      uiText('client.chat.couldNotReadTheImagePleaseChooseItAgain')); }
    finally { pending.current = false; setReading(false); }
  };
  const paste = useComposerPaste({ scope, active, busy: disabled,
    readClipboardImages: options.readClipboardImages, addFiles,
    insertText: (text, element) => {
      const value = controller.getSnapshot().draft;
      controller.edit(value.slice(0, element.selectionStart) + text + value.slice(element.selectionEnd));
    } });
  const drop = useFileDrop({ target, scope, active, disabled,
    subscribe: options.nativeFileDrop?.subscribe, addFiles,
    addPaths: async (paths, valid) => {
      const files = await options.nativeFileDrop!.readFiles(paths);
      if (valid()) await addFiles(files);
    }, report: () => setError(uiText('client.workspaceActions.couldNotPasteFilesCopyThemAgainAndRetry')) });
  const edit = (id: string, url: string) => {
    try {
      const images = controller.getSnapshot().images.map(image => image.id === id ? { ...image, url } : image);
      validate(images); controller.editImages(images);
    } catch (reason) { setError(reason instanceof Error ? reason.message : ''); }
  };
  return { input, target, drop, paste, reading: reading || paste.reading || drop.reading,
    isReading: () => pending.current || drop.isReading(), error: error || paste.error, addFiles, edit,
    remove: (id: string) => controller.editImages(controller.getSnapshot().images.filter(image => image.id !== id)),
    choose: () => input.current?.click() };
}
