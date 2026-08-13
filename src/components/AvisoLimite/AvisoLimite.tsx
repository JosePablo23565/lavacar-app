import type { ReactNode } from 'react'
import './AvisoLimite.css'

type Props = {
  titulo: string
  nota: string
  destacado?: { etiqueta: string; valor: string; extra?: string }
  children?: ReactNode
}

// Aviso de que se llego a un limite. Lo usan las citas y las opiniones
// para que los dos se vean iguales.
export function AvisoLimite({ titulo, nota, destacado, children }: Props) {
  return (
    <div className="avl">
      <div className="avl-titulo">
        <h3>{titulo}</h3>
      </div>

        {destacado && (
          <div className="avl-destacado">
            <span className="avl-etiqueta">{destacado.etiqueta}</span>
            <div className="avl-valores">
              <strong>{destacado.valor}</strong>
              {destacado.extra && (
                <>
                  <span className="avl-separador" />
                  <strong>{destacado.extra}</strong>
                </>
              )}
            </div>
          </div>
        )}

        <p className="avl-nota">{nota}</p>

      {children && <div className="avl-acciones">{children}</div>}
    </div>
  )
}
