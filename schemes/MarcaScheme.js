import z from 'zod'

const MarcaScheme=z.object({
    nombre:z.string().min(3)
})

export function validarMarca(object){
    return MarcaScheme.safeParse(object)
}