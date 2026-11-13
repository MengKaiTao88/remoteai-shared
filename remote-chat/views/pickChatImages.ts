import { t } from '../../localization/browserClient';
import { ChatImageError, draftImage, MAX_CHAT_IMAGES, chatImageCharLimit,
  validateChatImages, type DraftImage } from '../attachments';

import { base64Bytes, getChatPolicy, isDirectChat, MIB } from '../policy';
import { compressChatImage, ImagePolicyError } from '../compressImage';
import { normalizeImageDataUrl } from '../imageDataUrl';
import type { ConnectionMode } from '../protocol';

function readOriginal(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ChatImageError(t("client.chat.couldNotReadTheImagePleaseChooseItAgain")));
    reader.readAsDataURL(file);
  });
}

async function prepareImage(file: File, mode?: ConnectionMode) {
  if ((file.type && !file.type.startsWith('image/')) || !file.size) {
    throw new ChatImageError(t("client.chat.chooseAValidImage"));
  }
  const policy = getChatPolicy(mode);
  if (file.size > policy.imageSourceMaxMb * MIB) {
    throw new ChatImageError(t("client.chat.eachImageMustBeUnderMbChooseASmallerImage", { value1: policy.imageSourceMaxMb }));
  }
  if (isDirectChat(mode) && /^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
    return draftImage(normalizeImageDataUrl(await readOriginal(file)), mode);
  }
  try {
    const image = new Image();
    // Desktop WebViews allow inline images but deliberately disallow blob: image sources.
    image.src = await readOriginal(file);
    await image.decode();
    const compressed = await compressChatImage(async (edge, quality) => {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new ChatImageError(t("client.chat.thisBrowserCannotReadImagesTryAnotherBrowser"));
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/jpeg', quality);
      return { value: url, bytes: base64Bytes(url) };
    }, policy, Math.floor((chatImageCharLimit(mode) - 'data:image/jpeg;base64,'.length) / 4) * 3, mode);
    return draftImage(compressed, mode);
  } catch (error) {
    if (error instanceof ChatImageError || error instanceof ImagePolicyError) throw new ChatImageError(error.message);
    throw new ChatImageError(t("client.chat.couldNotReadThisImageTryAJpgOrPng"));
  }
}

export async function pickChatImages(files: File[], remaining: number, mode?: ConnectionMode): Promise<DraftImage[]> {
  if (files.length > remaining) throw new ChatImageError(t("client.chat.youCanAddUpToImagesAtATime", { value1: MAX_CHAT_IMAGES }));
  const images: DraftImage[] = [];
  for (const file of files) {
    images.push(await prepareImage(file, mode));
    validateChatImages(images.map((image) => image.url), mode);
  }
  return images;
}
