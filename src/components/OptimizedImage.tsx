import { useState, useRef, useEffect } from 'react'
// Supabase storage removed; use direct URLs or Cloudflare R2 via /api/assets

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  onLoad?: () => void
  onError?: () => void
  fallback?: string
}

export const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError,
  fallback = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800'
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)
  const [currentSrc, setCurrentSrc] = useState('')

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px'
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, isInView])

  // Generate responsive image URLs
  useEffect(() => {
    if (!isInView) return

    setCurrentSrc(src)
  }, [src, isInView])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setCurrentSrc(fallback)
    onError?.()
  }

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!src || hasError) return ''

    return ''
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && isInView && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Lazy loading placeholder */}
      {!isInView && (
        <div 
          ref={imgRef}
          className="bg-gray-100 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}

      {/* Actual image */}
      {isInView && currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={generateSrcSet()}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          className={`
            transition-opacity duration-300 
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && currentSrc === fallback && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Imagem não disponível</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for preloading images
export const useImagePreloader = (urls: string[]) => {
  useEffect(() => {
    urls.forEach(url => {
      if (url) {
        const img = new Image()
        img.src = url
      }
    })
  }, [urls])
}

// Component for product image gallery with optimized loading
interface ProductImageGalleryProps {
  images: string[]
  productName: string
  selectedIndex: number
  onImageSelect: (index: number) => void
  className?: string
}

export const ProductImageGallery = ({
  images,
  productName,
  selectedIndex,
  onImageSelect,
  className = ''
}: ProductImageGalleryProps) => {
  // Preload all images
  useImagePreloader(images)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main image */}
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
        <OptimizedImage
          src={images[selectedIndex] || images[0]}
          alt={`${productName} - Imagem ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
          priority={true}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => onImageSelect(index)}
              className={`
                flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors
                ${selectedIndex === index 
                  ? 'border-pink-500' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <OptimizedImage
                src={image}
                alt={`${productName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
                width={64}
                height={64}
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}