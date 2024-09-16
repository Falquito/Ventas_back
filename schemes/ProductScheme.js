import z from 'zod'

const ProductScheme=z.object({
    Nombre:z.string().min(3),
    Descripcion:z.string().min(5),
    Precio:z.number(),
    Stock:z.number(),
    Categoria:z.string().min(3),
    Marca:z.string().min(3)
})

export function validarProducto(object){
    return ProductScheme.safeParse(object)
}