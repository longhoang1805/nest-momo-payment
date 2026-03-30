import { useState, useRef, useEffect } from 'react'
import { X, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Book } from '../types'

type FormValues = {
  title: string
  author: string
  price: string
  description: string
  coverImage: string
  genre: string
  stock: string
  rating: string
}

const EMPTY: FormValues = {
  title: '',
  author: '',
  price: '',
  description: '',
  coverImage: '',
  genre: '',
  stock: '',
  rating: '',
}

function toForm(b: Book): FormValues {
  return {
    title: b.title,
    author: b.author,
    price: String(b.price),
    description: b.description ?? '',
    coverImage: b.coverImage ?? '',
    genre: b.genre ?? '',
    stock: String(b.stock ?? 0),
    rating: String(b.rating ?? 0),
  }
}

export function BookFormModal({
  book,
  onSave,
  onClose,
  isSaving,
}: {
  book: Book | null
  onSave: (data: Partial<Book>) => void
  onClose: () => void
  isSaving: boolean
}) {
  const isEdit = book !== null
  const [form, setForm] = useState<FormValues>(book ? toForm(book) : EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [imagePreview, setImagePreview] = useState<string>(book?.coverImage ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setImagePreview(form.coverImage)
  }, [form.coverImage])

  function set(key: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      set('coverImage', result)
    }
    reader.readAsDataURL(file)
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.title.trim()) errs.title = 'Required'
    if (!form.author.trim()) errs.author = 'Required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) errs.price = 'Must be a positive number'
    if (form.stock && isNaN(Number(form.stock))) errs.stock = 'Must be a number'
    if (form.rating && (isNaN(Number(form.rating)) || Number(form.rating) < 0 || Number(form.rating) > 5)) {
      errs.rating = 'Must be 0–5'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSave({
      title: form.title.trim(),
      author: form.author.trim(),
      price: Number(form.price),
      description: form.description.trim() || undefined,
      coverImage: form.coverImage.trim() || undefined,
      genre: form.genre.trim() || undefined,
      stock: form.stock ? Number(form.stock) : undefined,
      rating: form.rating ? Number(form.rating) : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-800">
            {isEdit ? 'Edit book' : 'Add new book'}
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">
            {/* Cover image */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">Cover Image</label>
              <div className="flex items-start gap-4">
                <div className="h-28 w-20 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="cover" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload file
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground">or paste a URL below</p>
                  <Input
                    placeholder="https://..."
                    value={form.coverImage.startsWith('data:') ? '' : form.coverImage}
                    onChange={(e) => set('coverImage', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Title + Author */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Book title"
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                  Author <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.author}
                  onChange={(e) => set('author', e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Author name"
                />
                {errors.author && <p className="text-xs text-red-500 mt-1">{errors.author}</p>}
              </div>
            </div>

            {/* Price + Genre */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                  Price (₫) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={form.price ? Number(form.price.replace(/,/g, '')).toLocaleString('en-US') : form.price}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '')
                    if (raw === '' || /^\d+$/.test(raw)) set('price', raw)
                  }}
                  className="h-9 text-sm"
                  placeholder="e.g. 150,000"
                />
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Genre</label>
                <Input
                  value={form.genre}
                  onChange={(e) => set('genre', e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. Fantasy"
                />
              </div>
            </div>

            {/* Stock + Rating */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Stock</label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. 50"
                />
                {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Rating (0–5)</label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={form.rating}
                  onChange={(e) => set('rating', e.target.value)}
                  className="h-9 text-sm"
                  placeholder="e.g. 4.5"
                />
                {errors.rating && <p className="text-xs text-red-500 mt-1">{errors.rating}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Book description…"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create book'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
