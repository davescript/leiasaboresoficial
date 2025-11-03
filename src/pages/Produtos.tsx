import { useState } from 'react';
import { mutate as swrMutate } from 'swr';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../state/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { OptimizedImage, ProductImageGallery } from '../components/OptimizedImage';
import { useProductsQuery } from '../hooks/useProductsQuery';
import { useCart } from '../hooks/useCart';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  image_url: string;
  category: string;
  stock: number;
  images?: string[];
}

export default function Produtos() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const itemsPerPage = 12;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const session = null as any;
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { addToCart: addToCartFromHook } = useCart();

  // Use SWR hook for data fetching
  const [sortBy, setSortBy] = useState<'price_asc'|'price_desc'|'newest'>('newest');
  const { data, isLoading: loading } = useProductsQuery({
    search: debouncedSearchTerm,
    category: selectedCategory,
    page: currentPage,
    limit: itemsPerPage,
    sort: sortBy,
  });
  const totalProducts = (data as any)?.total ?? 0;
  const totalPages = (data as any)?.totalPages ?? 1;
  const rawProducts = (data as any)?.products ?? [];

  const categories = [
    { id: 'all', name: 'Todos os Produtos', icon: '🍰' },
    { id: 'bolos', name: 'Bolos', icon: '🎂' },
    { id: 'tortas', name: 'Tortas', icon: '🥧' },
    { id: 'cupcakes', name: 'Cupcakes', icon: '🧁' },
    { id: 'brownies', name: 'Brownies', icon: '🍫' },
    { id: 'doces', name: 'Doces', icon: '🍬' },
  ];

  // Simular múltiplas imagens para cada produto
  const generateProductImages = (mainImage: string, productName: string) => {
    const variations = [
      mainImage,
      mainImage.replace('?w=800', '?w=800&sat=-20'),
      mainImage.replace('?w=800', '?w=800&brightness=10')
    ];
    return variations;
  };

  // Normalizar dados vindos do SWR
  const products: Product[] = Array.isArray(rawProducts)
    ? rawProducts.map((p: any) => {
        const basePriceCents: number = typeof p.price_cents === 'number' ? p.price_cents : (typeof p.price === 'number' ? Math.round(p.price * 100) : 0)
        const discountCents: number | undefined = typeof p.discount_price_cents === 'number' ? p.discount_price_cents : undefined
        const price: number = (discountCents ?? basePriceCents) / 100
        const discount_price: number | undefined = discountCents ? discountCents / 100 : undefined
        const image: string = p.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800';
        const category: string = p.category || 'doces';
        const stock: number = typeof p.stock === 'number' ? p.stock : 10;
        return {
          id: p.id,
          name: p.name,
          description: p.description || '',
          price,
          discount_price,
          image_url: image,
          category,
          stock,
          images: generateProductImages(image, p.name)
        } as Product;
      })
    : [];

  const addToCart = async (productId: string) => {
    if (!session) {
      showToast('Faça login para adicionar produtos ao carrinho', 'info');
      return;
    }

    try {
      await addToCartFromHook(productId, 1)
      showToast('Produto adicionado ao carrinho', 'success')
      try { swrMutate(['/api/cart', session.access_token]) } catch {}
    } catch (error) {
      console.error('Erro:', error)
      showToast('Erro ao adicionar produto ao carrinho', 'error')
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredProducts = products; // Products are already filtered by the API

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setSelectedImageIndex(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Nossos Produtos</h1>
            <p className="text-lg text-gray-600">Carregando delícias artesanais...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="app-card p-4 card-hover">
                <div className="skeleton-img" />
                <div className="mt-4 space-y-2">
                  <div className="skeleton-text w-2/3" />
                  <div className="skeleton-text w-1/2" />
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="skeleton-text w-24" />
                  <div className="skeleton-text w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Nossos Produtos
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubra nossa seleção de doces artesanais feitos com amor e ingredientes premium
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de Busca */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-pink-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 shadow-md hover:shadow-lg'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                {category.name}
              </button>
            ))}
            <div className="ml-4">
              <select
                value={sortBy}
                onChange={(e)=>setSortBy(e.target.value as any)}
                className="px-6 py-3 rounded-full bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 shadow-md"
              >
                <option value="newest">Mais novos</option>
                <option value="price_asc">Preço: menor→maior</option>
                <option value="price_desc">Preço: maior→menor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Informações de Busca */}
        {(searchTerm || selectedCategory !== 'all') && (
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              {totalProducts > 0 ? (
                <>
                  Mostrando {products.length} de {totalProducts} produtos
                  {searchTerm && ` para "${searchTerm}"`}
                  {selectedCategory !== 'all' && ` na categoria "${categories.find(c => c.id === selectedCategory)?.name}"`}
                </>
              ) : (
                <>
                  Nenhum produto encontrado
                  {searchTerm && ` para "${searchTerm}"`}
                  {selectedCategory !== 'all' && ` na categoria "${categories.find(c => c.id === selectedCategory)?.name}"`}
                </>
              )}
            </p>
          </div>
        )}

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="app-card overflow-hidden group card-hover"
            >
              {/* Imagem do Produto */}
              <div className="relative overflow-hidden">
                <OptimizedImage
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  width={400}
                  height={256}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="badge">
                    {categories.find(c => c.id === product.category)?.name || product.category}
                  </span>
                  {product.discount_price && (
                    <span className="badge bg-yellow-100 text-yellow-800 border-yellow-300">Promoção</span>
                  )}
                </div>

                {/* Botão de Visualizar */}
                <button
                  onClick={() => openProductModal(product)}
                  className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                {/* Indicador de Estoque */}
                {product.stock <= 5 && (
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Últimas {product.stock} unidades
                    </span>
                  </div>
                )}
              </div>

              {/* Conteúdo do Card */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-pink-600 flex items-center gap-2">
                    R$ {(product.discount_price ?? product.price).toFixed(2)}
                    {product.discount_price && (
                      <span className="text-sm line-through text-gray-500">R$ {product.price.toFixed(2)}</span>
                    )}
                  </div>
                  <div className={`text-sm ${product.stock>0?'text-green-600':'text-red-600'}`}>
                    {product.stock>0? 'Em estoque' : 'Esgotado'}
                  </div>
                </div>

                <button
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock === 0}
                  className={`btn btn-sm btn-primary w-full gap-2 ${
                    product.stock === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  {product.stock === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center space-x-2">
              {/* Botão Anterior */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 shadow-md hover:shadow-lg'
                }`}
              >
                Anterior
              </button>

              {/* Números das páginas */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-pink-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Botão Próximo */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 shadow-md hover:shadow-lg'
                }`}
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍰</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600">
              Não encontramos produtos nesta categoria. Tente outra categoria!
            </p>
          </div>
        )}
      </div>

      {/* Modal de Visualização do Produto */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {/* Botão Fechar */}
              <button
                onClick={closeProductModal}
                className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all duration-200"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                {/* Galeria de Imagens */}
                <ProductImageGallery
                  images={selectedProduct.images || [selectedProduct.image_url]}
                  productName={selectedProduct.name}
                  selectedIndex={selectedImageIndex}
                  onImageSelect={setSelectedImageIndex}
                />

                {/* Informações do Produto */}
                <div className="space-y-6">
                  <div>
                    <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                      {categories.find(c => c.id === selectedProduct.category)?.name || selectedProduct.category}
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-4xl font-bold text-pink-600">
                        R$ {selectedProduct.price.toFixed(2)}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Disponível</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedProduct.stock} unidades
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addToCart(selectedProduct.id);
                        closeProductModal();
                      }}
                      disabled={selectedProduct.stock === 0}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-3 ${
                        selectedProduct.stock === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow-lg transform hover:scale-105'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                      {selectedProduct.stock === 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
                    </button>
                  </div>

                  {/* Informações Adicionais */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3">Informações do Produto</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Feito artesanalmente
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ingredientes premium
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Entrega rápida
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}