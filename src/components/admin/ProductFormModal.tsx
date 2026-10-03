import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertTriangle, Upload, Link, Check, Trash2, RefreshCw } from 'lucide-react';
import { Product, Category } from '../../types/index.ts';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  onSave: (productData: Omit<Product, 'id' | 'created_at'>, id?: string) => Promise<any> | void;
}

export const ProductFormModal = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onSave,
}: ProductFormModalProps) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('189.00');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('15');
  const [deliveryCharges, setDeliveryCharges] = useState('0.00');
  const [categoryId, setCategoryId] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [imageFileSize, setImageFileSize] = useState<string>('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title);
      setSlug(productToEdit.slug);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price.toString());
      setSalePrice(productToEdit.sale_price ? productToEdit.sale_price.toString() : '');
      setStock(productToEdit.stock.toString());
      setDeliveryCharges(
        productToEdit.delivery_charges !== undefined && productToEdit.delivery_charges !== null
          ? productToEdit.delivery_charges.toString()
          : '0.00'
      );
      setCategoryId(productToEdit.category_id || (categories[0]?.id ?? ''));
      const existingImg = productToEdit.images && productToEdit.images[0] ? productToEdit.images[0] : '';
      setImageUrl(existingImg);
      setImageMode(existingImg.startsWith('data:') ? 'upload' : 'url');
      setImageFileName(existingImg.startsWith('data:') ? 'uploaded-device-image' : '');
      setImageFileSize('');
      setIsFeatured(productToEdit.is_featured);
    } else {
      setTitle('');
      setSlug('');
      setDescription('');
      setPrice('189.00');
      setSalePrice('');
      setStock('15');
      setDeliveryCharges('0.00');
      setCategoryId(categories[0]?.id || '');
      setImageUrl('');
      setImageFileName('');
      setImageFileSize('');
      setImageMode('upload');
      setIsFeatured(false);
    }
  }, [productToEdit, categories]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!productToEdit) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleFileProcess = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP, or SVG).');
      return;
    }
    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('Image file must be under 15MB.');
      return;
    }

    setError('');
    setImageFileName(file.name);
    const sizeInKb = Math.round(file.size / 1024);
    setImageFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setImageUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !price.trim() || !stock.trim()) {
      setError('Please provide a product title, price, and stock quantity.');
      return;
    }

    const numPrice = parseFloat(price);
    const numSalePrice = salePrice.trim() ? parseFloat(salePrice) : null;
    const numStock = parseInt(stock, 10);
    const numDeliveryCharges = parseFloat(deliveryCharges || '0');

    if (isNaN(numPrice) || numPrice < 0) {
      setError('Valid base price is required.');
      return;
    }

    if (numSalePrice !== null && (isNaN(numSalePrice) || numSalePrice < 0)) {
      setError('Sale price must be a valid number.');
      return;
    }

    if (isNaN(numDeliveryCharges) || numDeliveryCharges < 0) {
      setError('Delivery charges must be 0 or greater (0 for free delivery).');
      return;
    }

    if (!imageUrl.trim()) {
      setError('Please provide a product photo by uploading from your device or pasting an image link.');
      return;
    }

    setIsSaving(true);
    try {
      const productPayload: Omit<Product, 'id' | 'created_at'> = {
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description.trim(),
        price: numPrice,
        sale_price: numSalePrice,
        stock: isNaN(numStock) ? 0 : numStock,
        delivery_charges: numDeliveryCharges,
        category_id: categoryId || categories[0]?.id,
        images: [imageUrl.trim()],
        is_featured: isFeatured,
      };

      await onSave(productPayload, productToEdit?.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save product in database.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentDeliveryFee = parseFloat(deliveryCharges || '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF6F0]/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#FAF6F0] border border-[#D8CEC4] shadow-2xl p-6 sm:p-8 space-y-6 rounded-none max-h-[92vh] overflow-y-auto text-[#3B2314]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D8CEC4] pb-4">
          <div>
            <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-[#9E5A38] font-bold">
              Product Catalog
            </span>
            <h3 className="font-serif font-bold text-lg text-[#3B2314] uppercase tracking-wider">
              {productToEdit ? 'Edit Product' : 'Add New Product'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#3B2314]/60 hover:text-[#3B2314] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[#FAF0EF] border border-[#E8C2BF] text-xs text-[#8F423B] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-serif">
          {/* Title */}
          <div>
            <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Royal Embroidered Silk Anarkali"
              className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
            />
          </div>

          {/* Slug & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                Slug (URL Identifier)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="royal-embroidered-silk-anarkali"
                className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 font-mono rounded-none"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                Collection Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2.5 text-xs text-[#3B2314] uppercase tracking-wider focus:outline-none focus:border-[#9E5A38] rounded-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
              Product Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the fabric weaves, hand embroidery techniques, silhouette, and inclusions..."
              className="w-full bg-[#FFFDF9] border border-[#D8CEC4] px-3.5 py-2.5 text-xs text-[#3B2314] placeholder-[#3B2314]/40 focus:outline-none focus:border-[#9E5A38] rounded-none font-sans"
            />
          </div>

          {/* Pricing, Stock & Delivery Charges Row */}
          <div className="p-4 bg-[#FFFDF9] border border-[#D8CEC4] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                  Base Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-[#FAF6F0] border border-[#D8CEC4] px-3 py-2 text-xs text-[#3B2314] font-mono rounded-none focus:outline-none focus:border-[#9E5A38]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                  Sale Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Optional discount"
                  className="w-full bg-[#FAF6F0] border border-[#D8CEC4] px-3 py-2 text-xs text-[#3B2314] font-mono rounded-none focus:outline-none focus:border-[#9E5A38]"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#3B2314] font-semibold mb-1">
                  Live Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-[#FAF6F0] border border-[#D8CEC4] px-3 py-2 text-xs text-[#3B2314] font-mono rounded-none focus:outline-none focus:border-[#9E5A38]"
                />
              </div>
            </div>

            {/* DEDICATED DELIVERY CHARGES SECTION */}
            <div className="pt-3 border-t border-[#D8CEC4]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                <label className="block uppercase tracking-wider text-[#3B2314] font-bold text-xs flex items-center gap-1.5">
                  <span>Product Delivery Charges ($) *</span>
                  <span className="text-[10px] text-[#9E5A38] font-normal lowercase">(per order item)</span>
                </label>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#3B2314]/60 uppercase tracking-wider">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setDeliveryCharges('0.00')}
                    className={`px-2 py-0.5 text-[10px] border transition-colors ${
                      currentDeliveryFee === 0
                        ? 'bg-[#526A50] text-[#FAF6F0] border-[#526A50] font-bold'
                        : 'bg-[#FAF6F0] text-[#3B2314] border-[#D8CEC4] hover:border-[#3B2314]'
                    }`}
                  >
                    Free ($0)
                  </button>
                  {['5.00', '10.00', '15.00', '25.00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDeliveryCharges(preset)}
                      className={`px-2 py-0.5 text-[10px] border transition-colors ${
                        deliveryCharges === preset
                          ? 'bg-[#9E5A38] text-[#FAF6F0] border-[#9E5A38] font-bold'
                          : 'bg-[#FAF6F0] text-[#3B2314] border-[#D8CEC4] hover:border-[#3B2314]'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-44">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#3B2314]/60 font-mono">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={deliveryCharges}
                    onChange={(e) => setDeliveryCharges(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#FAF6F0] border border-[#D8CEC4] pl-7 pr-3 py-2 text-xs text-[#3B2314] font-mono rounded-none focus:outline-none focus:border-[#9E5A38] font-bold"
                  />
                </div>

                <div className="flex-1">
                  {currentDeliveryFee === 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-serif bg-[#EDF3EC] text-[#526A50] border border-[#C3D5C0]">
                      <Check className="w-3.5 h-3.5" />
                      <strong>Complimentary Delivery:</strong> Customer pays $0 shipping on this piece
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-serif bg-[#FAF6F0] text-[#9E5A38] border border-[#D8CEC4]">
                      <strong>Custom Delivery:</strong> +${currentDeliveryFee.toFixed(2)} delivery charge added to cart
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-[#3B2314]/60 mt-1.5 font-light">
                This exact delivery charge will appear on the product page and automatically calculate into the buyer&apos;s cart total.
              </p>
            </div>
          </div>

          {/* PRODUCT PHOTOGRAPHY: UPLOAD FROM DEVICE OR ADD LINK */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block uppercase tracking-wider text-[#3B2314] font-bold">
                  Product Image *
                </label>
                <p className="text-[10px] text-[#3B2314]/60 font-light">
                  Upload directly from your device storage or provide a web link
                </p>
              </div>

              {/* Toggle Mode Buttons */}
              <div className="flex border border-[#D8CEC4] bg-[#FFFDF9] overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors uppercase tracking-wider text-[10px] ${
                    imageMode === 'upload'
                      ? 'bg-[#9E5A38] text-[#FAF6F0] font-bold'
                      : 'text-[#3B2314]/80 hover:text-[#3B2314] hover:bg-[#F4EFE6]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors border-l border-[#D8CEC4] uppercase tracking-wider text-[10px] ${
                    imageMode === 'url'
                      ? 'bg-[#9E5A38] text-[#FAF6F0] font-bold'
                      : 'text-[#3B2314]/80 hover:text-[#3B2314] hover:bg-[#F4EFE6]'
                  }`}
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Add Web Link</span>
                </button>
              </div>
            </div>

            {/* UPLOAD FROM DEVICE OPTION */}
            {imageMode === 'upload' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
                  onChange={(e) => handleFileProcess(e.target.files?.[0])}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-[#9E5A38] bg-[#9E5A38]/10'
                      : 'border-[#D8CEC4] hover:border-[#3B2314] bg-[#FFFDF9]'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 border border-[#D8CEC4] bg-[#FAF6F0] flex items-center justify-center text-[#9E5A38] shadow-sm">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-xs uppercase tracking-wider text-[#3B2314]">
                        Click to browse or drop product photo here
                      </p>
                      <p className="text-[11px] text-[#3B2314]/60 font-light mt-0.5">
                        Supports PNG, JPG, JPEG, WEBP or SVG from your phone, tablet, or PC
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-1 px-4 py-1.5 bg-[#FAF6F0] hover:bg-[#F4EFE6] border border-[#3B2314] text-[#3B2314] text-[11px] font-serif uppercase tracking-wider font-semibold transition-colors"
                    >
                      Choose File from Device
                    </button>

                    {imageFileName && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#526A50] bg-[#EDF3EC] px-2.5 py-1 border border-[#C3D5C0]">
                          <Check className="w-3.5 h-3.5" />
                          <span>{imageFileName}</span>
                          {imageFileSize && <span className="opacity-70">({imageFileSize})</span>}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ADD WEB LINK OPTION */
              <div className="space-y-2 bg-[#FFFDF9] border border-[#D8CEC4] p-4">
                <label className="block text-[11px] uppercase tracking-wider text-[#3B2314] font-semibold">
                  Direct Image Web URL:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3B2314]/40" />
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImageFileName('');
                        setImageFileSize('');
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-[#FAF6F0] border border-[#D8CEC4] pl-9 pr-3.5 py-2 text-xs text-[#3B2314] placeholder-[#3B2314]/40 font-mono rounded-none focus:outline-none focus:border-[#9E5A38]"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#3B2314]/60 font-light">
                  Paste any public HTTPS image link. The preview below will reflect it immediately.
                </p>
              </div>
            )}

            {/* LIVE IMAGE PREVIEW CARD */}
            {imageUrl && (
              <div className="p-3 bg-[#FFFDF9] border border-[#D8CEC4] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="w-16 h-20 object-cover object-top border border-[#D8CEC4] bg-[#FAF6F0] shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#3B2314] block">
                      Active Photo Preview
                    </span>
                    <span className="text-[10px] text-[#526A50] font-serif flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3 text-[#526A50]" /> Ready for boutique storefront
                    </span>
                    <span className="text-[10px] text-[#3B2314]/60 font-mono truncate block mt-0.5">
                      {imageFileName || (imageUrl.startsWith('data:') ? 'Uploaded from device' : imageUrl)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (imageMode === 'upload') {
                        fileInputRef.current?.click();
                      } else {
                        setImageUrl('');
                      }
                    }}
                    className="p-1.5 text-[#3B2314]/60 hover:text-[#9E5A38] transition-colors"
                    title="Change Photo"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImageFileName('');
                      setImageFileSize('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 text-[#3B2314]/60 hover:text-[#8F423B] transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Featured Toggle */}
          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 accent-[#9E5A38] cursor-pointer"
            />
            <label htmlFor="isFeatured" className="text-xs uppercase tracking-wider font-semibold cursor-pointer">
              Showcase as Featured Drop on Boutique Homepage
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#D8CEC4] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#3B2314] text-[#3B2314] hover:bg-[#3B2314]/5 text-xs uppercase tracking-wider rounded-none font-serif"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#9E5A38] hover:bg-[#884A2B] text-[#FAF6F0] font-bold text-xs uppercase tracking-widest disabled:opacity-50 rounded-none shadow-sm flex items-center gap-2 font-serif"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Saving...' : productToEdit ? 'Save Changes' : 'Publish Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
