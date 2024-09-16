import z from 'zod'

const UserScheme=z.object({
    username:z.string(),
    password:z.string()
})

export function validarUsuario(object){
    return UserScheme.safeParse(object)
}