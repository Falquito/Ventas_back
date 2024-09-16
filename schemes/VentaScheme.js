import z from 'zod'

const VentaScheme=z.object({
    fechaVta:z.string().date(),
    totalVta:z.number(),
    nombreMetodoPago:z.string().min(3),
    descProdElegido:z.string().min(3),
    cantElegida:z.number()
})

export function validarVenta(object){
    return VentaScheme.safeParse(object)
}