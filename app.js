//Llamo a express
const express = require('express');
const app = express();

//seteo urlencoded para capturar los datos del formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//Llamo a dotenv
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});


//Seteo el directorio public
app.use('/resource', express.static('public'));
app.use('/resource', express.static(__dirname + '/public'));

//Establesco el motor de plantillas ejs
app.set('view engine', 'ejs'); 

//Llamo a bcryptjs
const bcryptjs = require('bcryptjs');

//Variable de Session
const session = require('express-session');

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

//Llamamos al modulo de conexion de la BD
const connection = require('./database/db');

//Rutas
app.get('/login', (req, res)=>{
    res.render('login');
})

app.get('/register', (req, res)=>{
    res.render('register');
})

//Inscripcion
app.post('/register', async(req, res)=>{
    const nombre = req.body.nombre;
    const correo = req.body.correo;
    const telefono = req.body.telefono;
    const direccion = req.body.direccion;
    const genero = req.body.genero;
    const password = req.body.password;

    let passwordHaash = await bcryptjs.hash(password, 8);
    connection.query('INSERT INTO users SET ?', {nombre:nombre, correo:correo, telefono:telefono, direccion:direccion, genero:genero, password:passwordHaash},
    async(error, results)=>{
        if (error) {
            console.log(error);
        } else {
           res.render('register',{
               alert: true,
               alertTitle: "Registration",
               alertMessage: "Exito en el Registro!",
               alertIcon: 'success',
               showConfirmButton: false,
               timer:'1500',
               ruta:''
           });
            
        }
    })
}) 

//Autenticacion
app.post('/auth', async(req, res)=>{
    const user = req.body.user;
    const password = req.body.password;
    let passwordHaash = await bcryptjs.hash(password, 8);
    if(user &&  password){
        connection.query('SELECT * FROM users WHERE correo = ?', [user], async (error, results)=>{
            if(results.length == 0 || !(await bcryptjs.compare(password, results[0].password))){
                res.render('login',{
                    alert:true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o Password Incorrectas",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer:false,
                    ruta: 'login'
                });
            }else{
                req.session.loggedin = true;
                req.session.nombre = results[0].nombre
                res.render('login',{
                    alert:true,
                    alertTitle: "Conexion Exitosa",
                    alertMessage: "Login Correcto!!",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer:1500,
                    ruta: ''
                });
            }
        })
    }else{
        res.send('INGRESE UN USUARIO Y UNA CONTRACEÑA');
    }
    

})

// Auth Pages
app.get('/', (req, res)=>{
    if (req.session.loggedin) {
        res.render('index', {
            login:true,
            nombre: req.session.nombre
        })
    } else {
        res.render('index', {
            login:false,
            nombre: 'Debe iniciar sesion'
        })
    }
})

app.get('/logout', (req, res)=>{
    req.session.destroy(()=>{
        res.redirect('/')
    })
})

app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
})