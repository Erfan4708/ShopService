import ProductForm from '@/components/ProductForm';
export default function EditProduct({ params }: { params: { id: string } }) { return <ProductForm id={params.id} />; }
