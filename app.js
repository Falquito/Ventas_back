import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import jwt from 'jsonwebtoken'
import { validarUsuario } from './schemes/UserScheme.js'
import { validarProducto } from './schemes/ProductScheme.js'
import { validarMarca } from './schemes/MarcaScheme.js'
import { validarVenta } from './schemes/VentaScheme.js'
//Declaro el puerto
const PORT=process.env.PORT ?? 3000
//configuro la bdd
const config ={
    host:'localhost',
    user:'root',
    port:3306,
    password:'',
    database:'USUARIOS'
}
//creo la conexion
const connection = await mysql.createConnection(config)

const app = express()

app.use(express.json())
app.use(cors())


app.get('/',async (req,res)=>{
    const result = await connection.query(
        'select * from USUARIOS;'
    )
    res.json(result)
})
app.post('/register',async (req,res)=>{
    const result = validarUsuario(req.body)
    if(result.success ){
        
        try {
            await connection.query(
                `insert into USUARIOS (username,password) values(?,?)`,[result.data.username,result.data.password]
                )
            const user = {username:result.data.username,password:result.data.password}
            res.status(201).json(user)
        } catch (error) {
            res.status(400).json({message:'usuario ya existente'})
        }
        
    }else{
        res.json({message:'No se pudo crear el usuario,verifique el formulario'})
    }
})
app.post('/login',async(req,res)=>{
    const result = validarUsuario(req.body)
    if(result.success){
    
        const bandera = await connection.query(
            `select username from USUARIOS where username=?;`,[result.data.username]
        )
         try {
             if(bandera[0][0].username===result.data.username){
                 const token = jwt.sign({username:result.data.username},'CLAVE_SECRETA_PARA_MI_PRIMER_JSON_WEB_TOKENJAJAJA',{expiresIn:'1h'})
                 return res.status(200).json({token})
             }
         } catch (error) {
            res.status(400).json({message:'Usuario no existe, Registrese'})
         }
    }
})


app.get('/inicio',(req,res)=>{
    const token = req.header('Authorization');
    if(!token) return res.status(401).send('Acceso denegado')
    try {
        const verified = jwt.verify(token,'CLAVE_SECRETA_PARA_MI_PRIMER_JSON_WEB_TOKENJAJAJA');
        res.json({result:verified})
    } catch (error) {
        res.status(400).send(error)
    }
})


app.get('/productos',async (req,res)=>{
    const [cantProd] = await connection.query(
        `SELECT COUNT(*) FROM Productos;`
    )
    return res.status(200).json(cantProd[0]["COUNT(*)"]);
})
app.get('/getproductos',async (req,res)=>{
    const [tableProducts] = await connection.query(
        `SELECT * FROM Productos`
    )
    if(tableProducts){
        return res.status(200).json(tableProducts)
    }else{
        return res.status(404).json({message:"Algo salio mal"})
    }
})

app.get('/ventas',async (req,res)=>{
    const [cantVta] = await connection.query(
        `SELECT COUNT(*) FROM Ventas`
    )
    return res.status(200).json(cantVta[0]["COUNT(*)"]);

})

app.get('/categorias',async (req,res)=>{
    try {
        const [result] = await connection.query(
            `SELECT Nombre FROM Categorias`
        )
        res.status(200).json(result)
    } catch (error) {
        res.status(400).send(error)
    }
})

app.get('/marcas',async(req,res)=>{
    try {
        const [result] = await connection.query(`
            SELECT Nombre FROM Marcas`)
        res.status(200).json(result)
    } catch (error) {
        res.status(400).send(error)
    }
})

app.post('/registrarProducto',async(req,res)=>{
    try {
        const result = validarProducto(req.body)
        if(result.success){
            try {
                const [response] = await connection.query(
                    `INSERT INTO Productos (Nombre,Descripcion,Precio,Stock,Categoria,Marca) VALUES (?,?,?,?,?,?)`,[result.data.Nombre,result.data.Descripcion,result.data.Precio,result.data.Stock,result.data.Categoria,result.data.Marca]
                )
                res.status(201).json({message:"producto creado"})
            } catch (error) {
                res.status(400).send(error)
            }
        }else{
            res.status(400).json(result.error.issues[0].message)
        }
    } catch (error) {
        res.status(400).send(error)
    }
})


app.delete('/deleteProducto',async(req,res)=>{
    try {
        const {Nombre,Descripcion} = req.body
        console.log(req.body)
        const [id] = await connection.query(
            `SELECT id FROM Productos WHERE Nombre=? and Descripcion=?;`,[Nombre,Descripcion]
        )
        console.log(id[0].id)
        await connection.query(`
            DELETE FROM Productos WHERE Nombre=? and id=?;`,[Nombre,id[0].id])
        res.status(200).json({message:'Producto Borrado!'})
    } catch (error) {
        res.status(400).send(error)
    }
})

app.patch('/editarProducto',async(req,res)=>{
    try {
        const {DescProdE,Nombre,Descripcion,Precio,Stock,Categoria,Marca}=req.body
        const [id]=await connection.query(`
            SELECT id FROM Productos WHERE Descripcion=?;`,[DescProdE])
        console.log(req.body)
        try {
            await connection.query(`
                UPDATE Productos
                SET Nombre=?,Descripcion=?,Precio=?,Stock=?,Categoria=?,Marca=?
                WHERE id=?;`,[Nombre,Descripcion,Precio,Stock,Categoria,Marca,id[0].id])
            res.status(200).json({message:'producto editado de manera correcta!'})
        } catch (error) {
            res.status(400).send(error)
        }
    } catch (error) {
        res.status(400).send(error)
    }
})

app.post('/registrarMarca',async(req,res)=>{
    const result = validarMarca(req.body)
    if(result.success){
        const {nombre} = req.body
        console.log(nombre)
        try {
            await connection.query(`
                INSERT INTO Marcas (Nombre) VALUES (?)`,[nombre])
            res.status(201).json({message:'Marca Creada correctamente'})
        } catch (error) {
            res.status(400).json(error)
        }
    }else{
        res.status(400).json({message:'Error al validar datos del formulario de marcas'})
    }
})
app.patch('/editarMarca',async(req,res)=>{
    try {
        const {nombre}=req.body
        const [id]=await connection.query(`
            SELECT id FROM Marcas WHERE Nombre=?;`,[nombre])
        console.log(req.body)
        try {
            await connection.query(`
                UPDATE Marcas
                SET Nombre=?
                WHERE id=?;`,[nombre,id[0].id])
            res.status(200).json({message:'marca editada de manera correcta!'})
        } catch (error) {
            res.status(400).send(error)
        }
    } catch (error) {
        res.status(400).send(error)
    }
})


app.post('/registrarCategoria',async(req,res)=>{
    const result = validarMarca(req.body)
    if(result.success){
        const {nombre} = req.body
        try {
            await connection.query(`
                INSERT INTO Categorias (Nombre) VALUES (?)`,[nombre])
            res.status(201).json({message:'Categoria Creada correctamente'})
        } catch (error) {
            res.status(400).json(error)
        }
    }else{
        res.status(400).json({message:'Error al validar datos del formulario de categorias'})
    }
})
app.patch('/editarCategoria',async(req,res)=>{
    try {
        const {nombre}=req.body
        const [id]=await connection.query(`
            SELECT id FROM Categorias WHERE Nombre=?;`,[nombre])
        console.log(req.body)
        try {
            await connection.query(`
                UPDATE Categorias
                SET Nombre=?
                WHERE id=?;`,[nombre,id[0].id])
            res.status(200).json({message:'Categoria editada de manera correcta!'})
        } catch (error) {
            res.status(400).send(error)
        }
    } catch (error) {
        res.status(400).send(error)
    }
})


// app.post('/registrarVenta',async (req,res)=>{
//     const result = validarVenta(req.body)
//     if(result.success){
//         try {
//             const {fechaVta,totalVta,nombreMetodoPago,descProdElegido,cantElegida} = req.body
//             console.log(req.body)
//             const [idProducto]=await connection.query(`
//                 SELECT id FROM Productos WHERE Descripcion=?
//                 `,[descProdElegido])
//             const [idMetodoPago] = await connection.query(`
//                 SELECT id FROM Metodos_de_Pago WHERE nombre=?`,[nombreMetodoPago])
//             await connection.query(`
//                 START TRANSACTION;
                
//                 INSERT INTO Ventas (fechaVta,totalVta,metodo_pago_id) VALUES (?,?,?);
//                 INSERT INTO Detalle_de_venta (codProd,codVta,cant) VALUES (?,(SELECT id FROM Ventas WHERE fechaVta=? AND totalVta = ?),?);
//                 COMMIT;
//                 `,[fechaVta,totalVta,idMetodoPago[0].id],idProducto[0].id,fechaVta,totalVta,cantElegida)

//             res.status(201).json({message:'venta'})
//         } catch (error) {
//             res.status(400).json(error)
//         }
//     }else{
//         res.status(400).json(result)
//     }
// })

app.get('/metodosPago',async(req,res)=>{
    try {
        const [result] = await connection.query(`
            SELECT nombre FROM Metodos_de_Pago`)
        res.status(200).json(result)
    } catch (error) {
        res.status(400).json(error)
    }
})

app.post('/registrarVenta', async (req, res) => {
    const result = validarVenta(req.body);
    if (result.success) {
        try {
            const { fechaVta, totalVta, nombreMetodoPago, descProdElegido, cantElegida } = req.body;

            // Obtenemos el id del producto y el método de pago
            const [idProducto] = await connection.query(`SELECT id FROM Productos WHERE Descripcion=?`, [descProdElegido]);
            const [idMetodoPago] = await connection.query(`SELECT id FROM Metodos_de_Pago WHERE nombre=?`, [nombreMetodoPago]);

            // Iniciar la transacción
            await connection.query('START TRANSACTION');

            // Insertar en la tabla Ventas
            const [ventaResult] = await connection.query(`
                INSERT INTO Ventas (fechaVta, totalVta, metodo_pago_id) 
                VALUES (?, ?, ?)`, [fechaVta, totalVta, idMetodoPago[0].id]);

            // Insertar en la tabla Detalle_de_venta
            await connection.query(`
                INSERT INTO Detalle_de_venta (codProd, codVta, cant) 
                VALUES (?, ?, ?)`, [idProducto[0].id, ventaResult.insertId, cantElegida]);

            // Confirmar la transacción
            await connection.query('COMMIT');

            res.status(201).json({ message: 'venta registrada exitosamente' });

        } catch (error) {
            // Si hay un error, revertir la transacción
            await connection.query('ROLLBACK');
            res.status(400).json({ message: 'Error en la transacción', error });
        }
    } else {
        res.status(400).json(result);
    }
});


app.get('/getVentas',async(req,res)=>{
    try {
        const [result] = await connection.query(`
            SELECT Productos.Nombre,cant,Metodos_De_Pago.nombre,Ventas.totalVta,Ventas.fechaVta FROM Detalle_de_Venta
            INNER JOIN Productos on Productos.id = codProd
            INNER JOIN Ventas on Ventas.id =codVta
            INNER JOIN Metodos_De_Pago on Metodos_De_Pago.id = Ventas.metodo_pago_id`)
        res.status(200).json(result)
    } catch (error) {
        res.status(400).json(error)
    }
})




app.listen(PORT,()=>{
    console.log(`server escuchando en el http://localhost:${PORT}`)
})