const products = [
  { id: 1, name: 'Aromatizante para auto', price: '$5', image: '🌿', whatsapp: 'Hola, quiero el Aromatizante' },
  { id: 2, name: 'Funda para asientos', price: '$25', image: '🪑', whatsapp: 'Hola, quiero la Funda para asientos' },
  { id: 3, name: 'Limpiavidrios profesional', price: '$8', image: '🧴', whatsapp: 'Hola, quiero el Limpiavidrios' },
  { id: 4, name: 'Cera para pintura', price: '$15', image: '✨', whatsapp: 'Hola, quiero la Cera para pintura' },
]

export function ProductCatalog() {
  const phoneNumber = '50612345678' // Cambia por tu número

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-6">🛍️ Productos a la venta</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-5xl mb-3">{product.image}</div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-blue-600 font-bold my-2">{product.price}</p>
            <a
              href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(product.whatsapp)}`}
              target="_blank"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
               Comprar por WhatsApp
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}