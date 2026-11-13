import { EMPTY_IMAGE, useImageGallery } from '../chat/ImageGallery';
import { ImagePreview } from './ImagePreview';
import { useImageSource } from './useImageSource';
import type { ImageNavigation } from '../chat/ImageGallery';

export function MessageImagePreview({ source, description, thumbnail, close }: {
  source: string; description: string; thumbnail: string; close: () => void;
}) {
  const { current, navigation } = useImageGallery({ source, description });
  return <SelectedImage key={current.source} source={current.source}
    description={current.description || description} close={close} navigation={navigation}
    thumbnail={current.source === source ? thumbnail : undefined} />;
}

function SelectedImage({ source, description, thumbnail, navigation, close }: {
  source: string; description: string; thumbnail?: string; navigation: ImageNavigation; close: () => void;
}) {
  const image = useImageSource(source, thumbnail);
  return <ImagePreview thumbnail={image.url ?? thumbnail ?? EMPTY_IMAGE} description={description}
    load={image.original} close={close} navigation={navigation} />;
}
